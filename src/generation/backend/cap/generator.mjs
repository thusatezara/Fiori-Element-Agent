import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { containsCredential } from "../../../orchestration/approval-gate.mjs";
import { createOutputTransaction } from "../../common/output-transaction.mjs";
import { renderFiles } from "../../common/template-renderer.mjs";
import { createCapGenerationReport } from "../../common/generation-report.mjs";
import { validateGeneratedCapProject } from "../../../validation/generated-cap-project.mjs";
import { validateCapHandoff } from "./request-validator.mjs";
import { createDomainPlan, cdsType } from "./domain-plan.mjs";
import { createServicePlan } from "./service-plan.mjs";
import { createBehaviorPlan } from "./behavior-plan.mjs";

const REQUIRED_CHECKS = ["HANDOFF_SCHEMA", "DOMAIN_SEMANTICS", "OUTPUT_BOUNDARY", "CREDENTIAL_SCAN", "CDS_COMPILE", "CONTRACT_TEST", "HANDLER_TEST", "LOCAL_START", "SNAPSHOT_CONSISTENCY"];

function capCheck(id, status, summary) { return { id, required: true, status, summary, durationMs: 0 }; }
function blocked(handoff, errors, checks = []) {
    return { resultVersion: "1.0", status: "BLOCKED", handoffId: handoff?.handoffId ?? "00000000-0000-4000-8000-000000000000", projectPath: null, files: [], checks, trace: [], serviceSnapshots: [], assumptions: [], prerequisites: errors.map((message) => ({ code: "INVALID_REQUEST", message })), risks: [] };
}
function scalar(value) {
    if (typeof value === "string") return `'${value.replaceAll("'", "''")}'`;
    return String(value);
}
function renderDomain(namespace, plan) {
    const aspectNames = new Set(plan.entities.flatMap(({ aspects }) => aspects));
    const imports = [...aspectNames].map((name) => name.toLowerCase()).join(", ");
    const lines = imports ? [`using { ${imports} } from '@sap/cds/common';`, "", `namespace ${namespace};`, ""] : [`namespace ${namespace};`, ""];
    for (const entity of plan.entities) {
        const aspects = (entity.aspects ?? []).map((name) => name.toLowerCase());
        lines.push(`entity ${entity.name}${aspects.length ? ` : ${aspects.join(", ")}` : ""} {`);
        for (const element of entity.elements) {
            const prefix = element.key ? "  key " : "  ";
            const required = element.nullable || element.key ? "" : " not null";
            const defaultValue = element.default === undefined || element.default === null ? "" : ` default ${scalar(element.default)}`;
            lines.push(`${prefix}${element.name} : ${cdsType(element)}${required}${defaultValue};`);
        }
        for (const relation of entity.relationships ?? []) {
            const target = plan.byId.get(relation.targetEntityId);
            const kind = relation.kind === "COMPOSITION" ? "Composition" : "Association";
            const cardinality = relation.cardinality === "TO_MANY" ? "many" : "one";
            const required = relation.nullable || cardinality === "many" ? "" : " not null";
            const on = relation.cardinality === "TO_MANY" ? ` on ${relation.name}.${relation.on.targetField} = $self.${relation.on.sourceField}` : "";
            lines.push(`  ${relation.name} : ${kind} to ${cardinality} ${target.name}${required}${on};`);
        }
        lines.push("}", "");
    }
    return `${lines.join("\n")}\n`;
}
function restriction(entries = []) {
    if (!entries.length) return [];
    const values = entries.map((entry) => `{ grant: [${entry.grant.map((value) => `'${value}'`).join(", ")}], to: [${entry.roles.map((value) => `'${value}'`).join(", ")}] }`);
    return [`@restrict: [${values.join(", ")}]`];
}
function operationSignature(operation) {
    const keyword = operation.kind === "FUNCTION" ? "function" : "action";
    const parameters = operation.parameters.map((parameter) => `${parameter.name}: ${parameter.type}${parameter.nullable === false ? " not null" : ""}`).join(", ");
    return `${keyword} ${operation.name}(${parameters})${operation.returns ? ` returns ${operation.returns.type}` : ""};`;
}
function renderService(namespace, plan) {
    const lines = [`using { ${namespace} as domain } from '../db/schema';`, ""];
    for (const service of plan.services) {
        lines.push(`@path: '${service.path}'`, ...restriction(service.authorization), `service ${service.name} {`);
        for (const entity of service.entities) {
            if (entity.capabilities.length === 1 && entity.capabilities[0] === "READ") lines.push("  @readonly");
            const capabilityAnnotations = { READ: "@Capabilities.ReadRestrictions.Readable: false", CREATE: "@Capabilities.InsertRestrictions.Insertable: false", UPDATE: "@Capabilities.UpdateRestrictions.Updatable: false", DELETE: "@Capabilities.DeleteRestrictions.Deletable: false" };
            for (const capability of ["READ", "CREATE", "UPDATE", "DELETE"]) if (!entity.capabilities.includes(capability)) lines.push(`  ${capabilityAnnotations[capability]}`);
            for (const line of restriction(entity.authorization)) lines.push(`  ${line}`);
            const bound = service.operations.filter(({ boundTo }) => boundTo === entity.name);
            if (bound.length) {
                lines.push(`  entity ${entity.name} as projection on domain.${entity.source.name} { ${entity.exposedElements.join(", ")} } actions {`);
                for (const operation of bound) lines.push(`    ${operationSignature(operation)}`);
                lines.push("  };");
            } else lines.push(`  entity ${entity.name} as projection on domain.${entity.source.name} { ${entity.exposedElements.join(", ")} };`);
        }
        for (const operation of service.operations.filter(({ boundTo }) => !boundTo)) lines.push(`  ${operationSignature(operation)}`);
        lines.push("}", "");
    }
    return `${lines.join("\n")}\n`;
}
function renderHandler(behaviorPlan) {
    const lines = ["import cds from '@sap/cds';", "", "export default class GeneratedService extends cds.ApplicationService {", "  async init() {"];
    for (const behavior of behaviorPlan.behaviors) {
        if (behavior.kind === "VALIDATION") {
            const c = behavior.condition;
            const comparisons = { REQUIRED: `value === undefined || value === null || value === ''`, EQ: `value !== ${JSON.stringify(c.value)}`, NE: `value === ${JSON.stringify(c.value)}`, GT: `!(value > ${JSON.stringify(c.value)})`, GTE: `!(value >= ${JSON.stringify(c.value)})`, LT: `!(value < ${JSON.stringify(c.value)})`, LTE: `!(value <= ${JSON.stringify(c.value)})` };
            lines.push(`    this.before(${JSON.stringify(behavior.events)}, '${behavior.target}', (req) => {`, `      const value = req.data[${JSON.stringify(c.field)}];`, `      if (${comparisons[c.operator]}) req.reject(400, '${behavior.error.code}', ${JSON.stringify(behavior.error.message)});`, "    });");
        } else {
            lines.push(`    this.on('${behavior.target}', async (req) => {`, "      const tx = cds.tx(req);");
            for (const statement of behavior.condition.statements) lines.push(`      await tx.run(UPDATE('${statement.entity}').set({ [${JSON.stringify(statement.set.field)}]: { '-=': req.data[${JSON.stringify(statement.set.decrementParameter)}] } }).where({ [${JSON.stringify(statement.where.field)}]: req.data[${JSON.stringify(statement.where.parameter)}] }));`);
            lines.push("      return true;", "    });");
        }
    }
    lines.push("    return super.init();", "  }", "}", "");
    return lines.join("\n");
}
function seedFiles(namespace, seedData) {
    const files = new Map();
    for (const [entity, rows] of Object.entries(seedData ?? {})) {
        if (!Array.isArray(rows) || !rows.length) continue;
        const headers = Object.keys(rows[0]);
        const csv = [headers.join(","), ...rows.map((row) => headers.map((header) => JSON.stringify(row[header] ?? "")).join(","))].join("\n");
        files.set(`db/data/${namespace}-${entity}.csv`, `${csv}\n`);
    }
    return files;
}
function buildTrace(requirements, files) {
    return requirements.map(({ id }) => ({ requirementId: id, disposition: "GENERATED", artifacts: files.filter((file) => file.requirementIds.includes(id)).map(({ path: filePath }) => filePath), checks: REQUIRED_CHECKS, reason: null }));
}

function renderGeneratedTest(servicePlan, behaviorPlan) {
    const roles = servicePlan.services.flatMap((service) => [...(service.authorization ?? []), ...service.entities.flatMap((entity) => entity.authorization ?? [])]).flatMap(({ roles: values }) => values);
    const errorCodes = behaviorPlan.behaviors.map(({ error }) => error?.code).filter(Boolean);
    const hasTransaction = behaviorPlan.behaviors.some(({ kind }) => kind === "ACTION" || kind === "TRANSACTION");
    return `import assert from 'node:assert/strict';\nimport { readFile } from 'node:fs/promises';\nimport test from 'node:test';\nconst service = await readFile(new URL('../srv/service.cds', import.meta.url), 'utf8');\nconst domain = await readFile(new URL('../db/schema.cds', import.meta.url), 'utf8');\ntest('generated CAP contract files are traceable', async () => {\n  assert.match(service, /service\\s+[A-Za-z_]/);\n  assert.match(domain, /entity\\s+[A-Za-z_]/);\n  for (const role of ${JSON.stringify(roles)}) assert.ok(service.includes(role));\n${behaviorPlan.behaviors.length ? `  const handler = await readFile(new URL('../srv/service.js', import.meta.url), 'utf8');\n  for (const code of ${JSON.stringify(errorCodes)}) assert.ok(handler.includes(code));\n  ${hasTransaction ? "assert.match(handler, /cds\\.tx\\(req\\)/);" : ""}` : ""}\n});\n`;
}

function generatedPackage(project) {
    const dependencies = { "@sap/cds": "^9.7.0", "@cap-js/sqlite": "^2.1.0" };
    let db = { kind: "sqlite", credentials: { url: ":memory:" } };
    if (project.persistence === "HANA") {
        dependencies["@cap-js/hana"] = "^2.0.0";
        db = {
            "[development]": { kind: "sqlite", credentials: { url: ":memory:" } },
            "[production]": { kind: "hana" }
        };
    }
    return {
        name: project.name,
        version: "1.0.0",
        private: true,
        type: "module",
        scripts: { start: "cds-serve", compile: "cds compile srv --to edmx", test: "node --test test/*.test.js", validate: "npm run compile && npm test" },
        engines: { node: ">=20" },
        dependencies,
        devDependencies: { "@sap/cds-dk": "^9.7.0" },
        cds: { requires: { db } }
    };
}

export async function runCapGeneration(handoff, { workspaceRoot = process.cwd(), validator = validateGeneratedCapProject } = {}) {
    const preflight = validateCapHandoff(handoff, { workspaceRoot });
    const initialChecks = [capCheck("HANDOFF_SCHEMA", preflight.passed ? "PASS" : "FAIL", preflight.passed ? "Protocol handoff is valid." : "Protocol handoff is invalid."), capCheck("OUTPUT_BOUNDARY", preflight.outputBoundaryPassed ? "PASS" : "FAIL", preflight.outputBoundaryPassed ? "Output remains inside the workspace." : "Output boundary is invalid."), capCheck("CREDENTIAL_SCAN", containsCredential(handoff) ? "FAIL" : "PASS", containsCredential(handoff) ? "Credential-like content was detected." : "No credential-like content was detected.")];
    if (!preflight.passed) return blocked(handoff, preflight.errors, initialChecks);
    try { await access(preflight.outputDirectory); return blocked(handoff, ["Output directory already exists."], initialChecks); } catch (error) { if (error.code !== "ENOENT") return blocked(handoff, ["Output directory could not be inspected."], initialChecks); }

    const domain = createDomainPlan(handoff.inputs.domain, preflight.requirementIds);
    if (!domain.passed) return blocked(handoff, domain.errors, [...initialChecks, capCheck("DOMAIN_SEMANTICS", "FAIL", "Domain semantics are invalid.")]);
    const service = createServicePlan(handoff.inputs.services, domain, preflight.requirementIds);
    if (!service.passed) return blocked(handoff, service.errors, [...initialChecks, capCheck("DOMAIN_SEMANTICS", "FAIL", "Service semantics are invalid.")]);
    const behavior = createBehaviorPlan(handoff.inputs.behaviors ?? [], service, preflight.requirementIds);
    if (!behavior.passed) return blocked(handoff, behavior.errors, [...initialChecks, capCheck("DOMAIN_SEMANTICS", "FAIL", "Behavior semantics are invalid.")]);
    const checks = [...initialChecks, capCheck("DOMAIN_SEMANTICS", "PASS", "Domain, service and behavior semantics are valid.")];
    const project = handoff.inputs.project;
    const allRequirementIds = handoff.inputs.requirements.map(({ id }) => id);
    const templateValues = {
        packageJson: JSON.stringify(generatedPackage(project), null, 2),
        readme: `# ${project.name}\n\nProtocol 100에서 생성한 CAP Node.js OData V4 Backend입니다. local validation은 SQLite를 사용합니다. HANA, XSUAA/IAS, Cloud Foundry binding 및 배포는 포함하지 않습니다.\n`,
        domain: renderDomain(project.namespace, domain),
        service: renderService(project.namespace, service),
        handler: behavior.behaviors.length ? renderHandler(behavior) : "",
        test: renderGeneratedTest(service, behavior)
    };
    const fileMap = { "package.json": "package.json.hbs", "README.md": "README.md.hbs", "db/schema.cds": "db/schema.cds.hbs", "srv/service.cds": "srv/service.cds.hbs", "test/service.test.js": "test/service.test.js.hbs" };
    if (behavior.behaviors.length) fileMap["srv/service.js"] = "srv/service.js.hbs";
    const rendered = await renderFiles("cap-nodejs", fileMap, templateValues);
    for (const [name, value] of seedFiles(project.namespace, handoff.inputs.seedData)) rendered.set(name, value);
    const transaction = await createOutputTransaction(preflight.outputDirectory);
    try {
        await transaction.write(rendered);
        const validation = await validator(transaction.stagingDirectory, { domain, service, behavior });
        checks.push(...validation.checks);
        if (!validation.passed) {
            await transaction.rollback();
            return { resultVersion: "1.0", status: "FAILED", handoffId: handoff.handoffId, projectPath: null, files: [], checks, trace: [], serviceSnapshots: [], assumptions: [], prerequisites: [{ code: "LOCAL_VALIDATION_FAILED", message: "One or more mandatory CAP validation checks failed." }], risks: [] };
        }
        const metadataFiles = new Map();
        validation.serviceSnapshots.forEach((snapshot) => metadataFiles.set(snapshot.metadataPath, validation.metadataByService.get(snapshot.serviceName)));
        metadataFiles.set("gen/contract/service-snapshot.json", `${JSON.stringify(validation.serviceSnapshots, null, 2)}\n`);
        const files = [...rendered.keys(), ...metadataFiles.keys(), "cap-generation-report.json"].map((filePath) => ({ path: filePath, kind: filePath.endsWith("schema.cds") ? "DOMAIN_MODEL" : filePath.endsWith("service.cds") ? "SERVICE_MODEL" : filePath.endsWith("service.js") ? "HANDLER" : filePath.endsWith(".test.js") ? "TEST" : filePath.endsWith(".xml") ? "METADATA" : filePath.includes("snapshot") ? "SNAPSHOT" : filePath.endsWith("README.md") ? "DOCUMENTATION" : filePath.endsWith("report.json") ? "REPORT" : "CONFIG", requirementIds: allRequirementIds }));
        const trace = buildTrace(handoff.inputs.requirements, files);
        const result = { resultVersion: "1.0", status: "VALIDATED", handoffId: handoff.handoffId, projectPath: path.relative(workspaceRoot, preflight.outputDirectory).replaceAll("\\", "/"), files, checks, trace, serviceSnapshots: validation.serviceSnapshots, assumptions: ["OData V4 and CAP Node.js are used as approved by the request."], prerequisites: [{ code: "PRODUCTION_BINDING_UNVERIFIED", message: "HANA, XSUAA/IAS and Cloud Foundry bindings are not created or verified by protocol 100." }], risks: project.persistence === "HANA" ? ["HANA is an intent only until protocol 200/300 provides and validates a binding."] : ["SQLite persistence is local/demo-oriented and must not be treated as durable production storage."] };
        metadataFiles.set("cap-generation-report.json", `${JSON.stringify(createCapGenerationReport(result), null, 2)}\n`);
        if (containsCredential([...rendered.values()].join("\n")) || containsCredential([...metadataFiles.values()].join("\n"))) throw new Error("Generated output failed credential scan.");
        await transaction.write(metadataFiles);
        await transaction.commit();
        return result;
    } catch (error) {
        await transaction.rollback();
        return { resultVersion: "1.0", status: "FAILED", handoffId: handoff.handoffId, projectPath: null, files: [], checks, trace: [], serviceSnapshots: [], assumptions: [], prerequisites: [{ code: "GENERATION_FAILED", message: error.message }], risks: [] };
    }
}
