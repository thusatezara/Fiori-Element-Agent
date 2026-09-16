import { containsCredential } from "../../orchestration/approval-gate.mjs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SHA256 = /^[a-f0-9]{64}$/i;

export function validateCompositionRequest(request) {
    const errors = [];
    if (containsCredential(request)) errors.push("Composition request contains credential-like data.");
    if (request?.handoffVersion !== "1.0") errors.push("Unsupported handoffVersion.");
    if (!UUID.test(request?.handoffId ?? "")) errors.push("Invalid handoffId.");
    if (!UUID.test(request?.planId ?? "")) errors.push("Invalid planId.");
    if (request?.protocol?.id !== "200" || request?.protocol?.version !== "1.0") errors.push("Protocol must be 200@1.0.");
    if (!Array.isArray(request?.completedDependencies) || request.completedDependencies.length === 0) errors.push("completedDependencies is required.");
    if (!/^[a-z][a-z0-9-]{0,62}$/.test(request?.solutionId ?? "")) errors.push("Invalid solutionId.");
    if (!request?.outputDirectory) errors.push("outputDirectory is required.");
    if (!Array.isArray(request?.components) || request.components.length === 0) errors.push("At least one component is required.");
    for (const component of request?.components ?? []) {
        if (!UUID.test(component.resultId ?? "")) errors.push("Component resultId must be a UUID.");
        if (component.validationStatus !== "PASSED") errors.push(`Component ${component.resultId ?? "unknown"} is not validated.`);
        if (!SHA256.test(component.checksum ?? "")) errors.push(`Component ${component.resultId ?? "unknown"} has an invalid checksum.`);
        if (!component.outputPath) errors.push(`Component ${component.resultId ?? "unknown"} has no outputPath.`);
    }
    if (!request?.identity?.applicationId || !/^\d+\.\d+\.\d+$/.test(request?.identity?.version ?? "")) errors.push("Application identity/version is invalid.");
    return { passed: errors.length === 0, errors };
}

