import { containsCredential } from "../../orchestration/approval-gate.mjs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SHA256 = /^[a-f0-9]{64}$/i;

export function validateDeploymentRequest(request) {
    const errors = [];
    if (containsCredential(request)) errors.push("Deployment request contains credential-like data.");
    if (request?.handoffVersion !== "1.0" || request?.protocol?.id !== "300" || request?.protocol?.version !== "1.0") errors.push("Protocol handoff must be 300@1.0.");
    for (const key of ["handoffId", "planId", "idempotencyKey"]) if (!UUID.test(request?.[key] ?? "")) errors.push(`${key} must be a UUID.`);
    if (request?.deployIntent !== true) errors.push("Explicit deployIntent is required.");
    if (request?.artifact?.status !== "READY" || !SHA256.test(request?.artifact?.archiveChecksum ?? "")) errors.push("A READY artifact with checksum is required.");
    try { if (new URL(request?.target?.api).protocol !== "https:") errors.push("Target API must use HTTPS."); } catch { errors.push("Target API must be a valid URL."); }
    for (const field of ["org", "space", "stage"]) if (!request?.target?.[field]) errors.push(`Target ${field} is required.`);
    if (!["DEV", "TEST", "PROD"].includes(request?.target?.stage)) errors.push("Target stage must be DEV, TEST or PROD.");
    if (!request?.preflightSnapshot?.snapshotId) errors.push("A preflightSnapshot is required.");
    if (!request?.approval) errors.push("Approval evidence is required.");
    return { passed: errors.length === 0, errors };
}

