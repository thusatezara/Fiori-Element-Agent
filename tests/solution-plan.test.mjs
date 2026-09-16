 import assert from "node:assert/strict";
import test from "node:test";
import { evaluateApprovalGate } from "../src/orchestration/approval-gate.mjs";
import { getProtocol, listProtocols } from "../src/orchestration/protocol-registry.mjs";
import { createSolutionPlan } from "../src/orchestration/solution-plan.mjs";
import { normalizeSolutionRequest } from "../src/orchestration/solution-request.mjs";
import { executeProtocolStep } from "../src/orchestration/workflow-executor.mjs";
import { createProtocolHandoff, validateProtocolHandoff } from "../src/orchestration/protocol-handoff.mjs";
import { validateSolutionPlan } from "../src/validation/solution-plan.mjs";
import { main as planMain } from "../src/cli/plan.mjs";

test("000 classifies a legacy OData Fiori request as a frontend handoff", () => {
    const request = normalizeSolutionRequest({ request: "기존 OData로 구매오더 Fiori Elements 앱을 만들어줘" });
    assert.deepEqual(request.scopes, ["FRONTEND"]);
    const plan = createSolutionPlan(request);
    assert.equal(plan.status, "READY");
    assert.deepEqual(plan.steps.map(({ scope }) => scope), ["FRONTEND"]);
    assert.equal(plan.steps[0].protocol.id, "001");
    assert.equal(plan.steps[0].readiness, "READY");
    assert.deepEqual(validateSolutionPlan(plan), { passed: true, errors: [] });
});

test("000 orders a CAP, Fiori and MTA request by service-contract dependency", () => {
    const request = normalizeSolutionRequest({ request: "재고 관리 CAP backend와 Fiori Elements 화면을 만들고 MTA로 구성해줘" });
    const plan = createSolutionPlan(request);
    assert.deepEqual(plan.steps.map(({ scope }) => scope), ["BACKEND", "FRONTEND", "PACKAGE"]);
    assert.deepEqual(plan.steps[1].dependsOn, ["backend"]);
    assert.deepEqual(plan.steps[2].dependsOn, ["backend", "frontend"]);
    assert.equal(plan.status, "NEEDS_INPUT");
    assert.equal(plan.steps[0].readiness, "NEEDS_INPUT");
    assert.match(plan.steps[0].blockingReasons.join(" "), /SQLITE.*HANA/);
    assert.ok(plan.steps.slice(1).every(({ readiness }) => readiness === "BLOCKED"));
});

test("000 asks for an explicit CAP database instead of defaulting to SQLite", () => {
    const request = normalizeSolutionRequest({ request: "CAP backend를 만들어줘" });
    const plan = createSolutionPlan(request);
    assert.deepEqual(request.backend, { persistence: null, source: "UNSPECIFIED" });
    assert.equal(plan.status, "NEEDS_INPUT");
    assert.equal(plan.steps[0].readiness, "NEEDS_INPUT");
    assert.match(plan.steps[0].blockingReasons.join(" "), /database.*SQLITE.*HANA/i);
});

test("000 accepts an explicit CAP database from text or structured input", () => {
    const sqlite = normalizeSolutionRequest({ request: "SQLite를 사용하는 CAP backend를 만들어줘" });
    assert.deepEqual(sqlite.backend, { persistence: "SQLITE", source: "REQUEST_TEXT" });
    assert.equal(createSolutionPlan(sqlite).steps[0].readiness, "READY");

    const hana = normalizeSolutionRequest({ request: "CAP backend를 만들어줘", backend: { persistence: "HANA" } });
    assert.deepEqual(hana.backend, { persistence: "HANA", source: "STRUCTURED_INPUT" });
    assert.equal(createSolutionPlan(hana).steps[0].readiness, "READY");
});

test("000 rejects ambiguous or conflicting CAP database choices", () => {
    assert.throws(
        () => normalizeSolutionRequest({ request: "SQLite와 HANA를 사용하는 CAP backend를 만들어줘" }),
        /ambiguous/i
    );
    assert.throws(
        () => normalizeSolutionRequest({ request: "SQLite CAP backend를 만들어줘", backend: { persistence: "HANA" } }),
        /conflicts/i
    );
});

test("registry maps every scope once and exposes implementation honestly", () => {
    const protocols = listProtocols();
    assert.deepEqual(protocols.map(({ id }) => id), ["001", "100", "200", "300", "400"]);
    assert.equal(new Set(protocols.map(({ scope }) => scope)).size, protocols.length);
    assert.equal(getProtocol("FRONTEND").status, "IMPLEMENTED");
    assert.equal(getProtocol("BACKEND").status, "IMPLEMENTED");
    for (const scope of ["PUBLISH_WORK_ZONE"]) {
        assert.equal(getProtocol(scope).status, "DEFINED");
    }
    for (const scope of ["PACKAGE", "DEPLOY_CF"]) assert.equal(getProtocol(scope).status, "IMPLEMENTED");
});

test("defined protocols return a structured blocked result instead of executing", async () => {
    const request = normalizeSolutionRequest({ request: "Cloud Foundry에 배포하고 Work Zone에 타일을 등록해줘", cloudFoundry: { api: "https://api.cf.example.test", org: "demo", space: "dev", stage: "DEV" }, workZone: { edition: "STANDARD", subaccount: "demo", site: "main", contentTarget: "apps" } });
    const step = createSolutionPlan(request).steps.find(({ scope }) => scope === "PUBLISH_WORK_ZONE");
    const result = await executeProtocolStep(step, { request });
    assert.equal(result.status, "BLOCKED");
    assert.equal(result.code, "PROTOCOL_NOT_IMPLEMENTED");
    assert.equal(result.protocolId, "400");
});

test("deploy and Work Zone publication require complete targets", () => {
    const request = normalizeSolutionRequest({ request: "Cloud Foundry에 배포하고 Work Zone에 타일을 등록해줘" });
    const plan = createSolutionPlan(request);
    assert.deepEqual(plan.steps.map(({ scope }) => scope), ["PACKAGE", "DEPLOY_CF", "PUBLISH_WORK_ZONE"]);
    assert.equal(plan.status, "NEEDS_INPUT");
    assert.equal(plan.steps[1].readiness, "NEEDS_INPUT");
    assert.equal(plan.steps[2].readiness, "NEEDS_INPUT");
    assert.match(plan.steps[1].blockingReasons.join(" "), /api|org|space|stage/);
    assert.match(plan.steps[2].blockingReasons.join(" "), /edition|subaccount|site|contentTarget/);
});

test("complete external targets pass the input gate and expose implemented deployment", () => {
    const request = normalizeSolutionRequest({
        request: "Cloud Foundry에 배포하고 Work Zone에 타일을 등록해줘",
        cloudFoundry: { api: "https://api.cf.example.test", org: "demo-org", space: "dev", stage: "DEV" },
        workZone: { edition: "STANDARD", subaccount: "demo", site: "main", contentTarget: "apps" }
    });
    const plan = createSolutionPlan(request);
    assert.equal(plan.steps[1].protocol.status, "IMPLEMENTED");
    assert.equal(plan.steps[1].readiness, "READY");
    assert.equal(plan.steps[2].readiness, "NOT_IMPLEMENTED");
});

test("approval gate rejects credentials in target references", () => {
    const result = evaluateApprovalGate("DEPLOY_CF", {
        externalChangeIntent: true,
        requestedTargets: {
            cloudFoundry: { api: "https://user:secret@api.cf.example.test", org: "demo", space: "dev", stage: "DEV" }
        }
    });
    assert.equal(result.ready, false);
    assert.match(result.reasons.join(" "), /credential/i);
});

test("request normalization refuses to retain credentials", () => {
    assert.throws(() => normalizeSolutionRequest({
        request: "Cloud Foundry에 배포해줘",
        cloudFoundry: { api: "https://user:secret@api.cf.example.test" }
    }), /credential/i);
    assert.throws(() => normalizeSolutionRequest({
        request: "Cloud Foundry에 배포해줘 token=do-not-store"
    }), /credential/i);
});

test("workflow execution reports missing external prerequisites before executor status", async () => {
    const request = normalizeSolutionRequest({ request: "Cloud Foundry에 배포해줘" });
    const step = createSolutionPlan(request).steps.find(({ scope }) => scope === "DEPLOY_CF");
    const result = await executeProtocolStep(step, { request });
    assert.equal(result.code, "PREREQUISITE_MISSING");
    assert.equal(result.retryable, true);
});

test("workflow execution requires completion evidence for every dependency", async () => {
    const request = normalizeSolutionRequest({ request: "CAP backend와 Fiori Elements 화면을 만들어줘" });
    const plan = createSolutionPlan(request);
    const plannedStep = plan.steps.find(({ scope }) => scope === "FRONTEND");
    const executableStep = { ...plannedStep, readiness: "READY", blockingReasons: [] };
    const handoff = createProtocolHandoff(plan, plannedStep.id);
    const blocked = await executeProtocolStep(executableStep, handoff);
    assert.equal(blocked.code, "PREREQUISITE_MISSING");
    assert.match(blocked.reasons.join(" "), /backend/);
});

test("protocol handoff is versioned, step-bound and credential-free", () => {
    const request = normalizeSolutionRequest({ request: "기존 OData로 Fiori Elements 앱을 만들어줘" });
    const plan = createSolutionPlan(request);
    const step = plan.steps[0];
    const handoff = createProtocolHandoff(plan, step.id, { inputs: { request: request.originalText } });
    assert.deepEqual(validateProtocolHandoff(handoff, step), { passed: true, errors: [] });
    assert.equal(validateProtocolHandoff({ ...handoff, handoffVersion: "2.0" }, step).passed, false);
    assert.throws(
        () => createProtocolHandoff(plan, step.id, { inputs: { token: "do-not-store" } }),
        /credential/i
    );
});

test("workflow refuses an invalid handoff before calling an implemented executor", async () => {
    const request = normalizeSolutionRequest({ request: "기존 OData로 Fiori Elements 앱을 만들어줘" });
    const step = createSolutionPlan(request).steps[0];
    const result = await executeProtocolStep(step, {});
    assert.equal(result.code, "INVALID_HANDOFF");
    assert.equal(result.retryable, true);
});

test("project-scoped agents reference central protocol specs", async () => {
    const files = ["frontend-agent.toml", "cap-agent.toml", "deployment-agent.toml", "work-zone-agent.toml"];
    for (const file of files) {
        const text = await import("node:fs/promises").then(({ readFile }) => readFile(new URL(`../.codex/agents/${file}`, import.meta.url), "utf8"));
        assert.match(text, /name = /);
        assert.match(text, /description = /);
        assert.match(text, /developer_instructions = /);
        assert.match(text, /specs\//);
    }
});

test("planning CLI maps target options without performing deployment", async () => {
    const originalLog = console.log;
    let rendered = "";
    console.log = (value) => { rendered = String(value); };
    try {
        const plan = await planMain([
            "--request", "Cloud Foundry에 배포해줘",
            "--cf-api", "https://api.cf.example.test",
            "--cf-org", "demo-org",
            "--cf-space", "dev",
            "--stage", "DEV"
        ]);
        assert.equal(plan.steps.find(({ scope }) => scope === "DEPLOY_CF").readiness, "READY");
        assert.match(rendered, /"protocol"/);
        assert.doesNotMatch(rendered, /password|authorization|token/i);
    } finally {
        console.log = originalLog;
    }
});

test("planning CLI maps an explicit CAP database", async () => {
    const originalLog = console.log;
    let rendered = "";
    console.log = (value) => { rendered = String(value); };
    try {
        const plan = await planMain(["--request", "CAP backend를 만들어줘", "--db", "HANA"]);
        assert.equal(plan.request.backend.persistence, "HANA");
        assert.equal(plan.steps[0].readiness, "READY");
        assert.match(rendered, /\"persistence\": \"HANA\"/);
    } finally {
        console.log = originalLog;
    }
});
