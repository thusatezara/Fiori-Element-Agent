import path from "node:path";
import { access } from "node:fs/promises";
import { validateCompositionRequest } from "./contract.mjs";
import { validateComponentResults } from "./component-result-adapter.mjs";

export async function preflightComposition(request, workspaceRoot) {
    const contract = validateCompositionRequest(request);
    if (!contract.passed) return { passed: false, errors: contract.errors };
    const outputDirectory = path.resolve(workspaceRoot, request.outputDirectory);
    const relative = path.relative(workspaceRoot, outputDirectory);
    if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) return { passed: false, errors: ["Output directory must be a child of the workspace."] };
    try {
        await access(outputDirectory);
        return { passed: false, errors: [`Output directory already exists: ${request.outputDirectory}`] };
    } catch (error) {
        if (error.code !== "ENOENT") throw error;
    }
    try {
        const components = await validateComponentResults(request.components, workspaceRoot);
        return { passed: true, errors: [], outputDirectory, components };
    } catch (error) {
        return { passed: false, errors: [error.message] };
    }
}

