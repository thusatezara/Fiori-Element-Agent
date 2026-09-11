import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createGenerationContext, sanitizeProjectName } from "../generation/common/generator-contract.mjs";
import { assertOutputDoesNotExist, assertOutputInsideWorkspace, writeApplicationAtomically } from "../generation/common/output-transaction.mjs";
import { createGenerationReport } from "../generation/common/generation-report.mjs";
import { validateGeneratedProject } from "../validation/generated-project.mjs";
import { classifyRequest } from "./assessment.mjs";
import { handoffToSingleGenerator } from "./handoff.mjs";
import { extractUrl, metadataHash, parseODataMetadata, parseServiceInput, readMetadata } from "./service-inspection.mjs";

const REPO_ROOT = resolve(fileURLToPath(new URL("../..", import.meta.url)));

export async function runGeneration(options = {}) {
    const request = String(options.request ?? "").trim();
    const suppliedUrl = String(options.odata_url ?? extractUrl(request) ?? "").trim();
    if (!suppliedUrl) throw new Error("An OData URL is required. Provide --odata-url or include an https URL in --request.");

    const serviceInput = parseServiceInput(suppliedUrl, options.entity_set);
    const metadataFile = options.metadata_file ? resolve(REPO_ROOT, options.metadata_file) : null;
    const metadataXml = await readMetadata(serviceInput, metadataFile);
    const service = parseODataMetadata(metadataXml, serviceInput, options.entity_set);
    const assessment = classifyRequest(request, service, options.type);
    const projectName = sanitizeProjectName(options.project_name ?? service.entitySet);
    const outputDirectory = resolve(REPO_ROOT, options.output ?? `generated/${projectName}`);

    assertOutputInsideWorkspace(outputDirectory, REPO_ROOT);
    await assertOutputDoesNotExist(outputDirectory);

    const context = createGenerationContext({
        request: request || `Create a SAP Fiori application for ${service.entitySet}.`,
        service,
        assessment,
        projectName,
        outputDirectory,
        metadataHash: metadataHash(metadataXml),
        flpIntent: options.flp_intent
    });
    const generated = await handoffToSingleGenerator(context);
    generated.files.set("fiori-agent-report.json", "{}\n");
    const validation = validateGeneratedProject(generated.profile, generated.files, context);
    const report = createGenerationReport(context, {
        columns: generated.columns.map(({ name }) => name),
        filters: generated.filters.map(({ name }) => name),
        files: [...generated.files.keys()].sort(),
        details: generated.details ?? {}
    }, validation);
    generated.files.set("fiori-agent-report.json", `${JSON.stringify(report, null, 2)}\n`);
    await writeApplicationAtomically(outputDirectory, generated.files);

    return {
        status: "GENERATED",
        protocol: { entry: "001", selectedGenerator: context.assessment.handoff },
        assessment,
        service: report.service,
        output: { directory: outputDirectory, projectName, files: [...generated.files.keys()].sort() },
        validation
    };
}

export { classifyRequest, extractUrl, parseODataMetadata, parseServiceInput };
