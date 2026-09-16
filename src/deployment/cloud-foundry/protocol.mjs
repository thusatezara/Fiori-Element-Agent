import { randomUUID } from "node:crypto";
import { createCfProcessAdapter } from "./cf-process-adapter.mjs";
import { createDeploymentPreflight, validateExecutionGate } from "./deployment-gate.mjs";
import { targetFingerprint } from "./target-inspector.mjs";
import { getOperation, recordOperation } from "./operation-tracker.mjs";
import { blockedDeployment, completedDeployment } from "./deployment-report.mjs";
import { validateDeployment } from "./deployment-validator.mjs";

function operationIdFrom(output) {
    return String(output).match(/(?:process|operation)\s+id\s*[:=]\s*([a-z0-9-]+)/i)?.[1] ?? null;
}

export { createDeploymentPreflight } from "./deployment-gate.mjs";

export async function deployToCloudFoundry(request, { adapter = createCfProcessAdapter() } = {}) {
    request = { ...request, targetFingerprint: targetFingerprint(request.target) };
    const existing = getOperation(request.idempotencyKey);
    if (existing?.status === "SUCCEEDED") return existing.result;
    const gate = await validateExecutionGate(request, { adapter });
    if (!gate.passed) return blockedDeployment(request, gate.errors, gate.snapshot?.checks ?? []);
    const startedAt = new Date().toISOString();
    recordOperation(request.idempotencyKey, { status: "RUNNING", startedAt });
    const deployResult = await adapter.run(["deploy", request.artifact.archivePath, "--version-rule", "ALL", "--abort-on-error"]);
    const operationId = operationIdFrom(`${deployResult.stdout}\n${deployResult.stderr}`) ?? `cf-${randomUUID()}`;
    const observed = await validateDeployment({ applicationId: request.artifact.applicationId, deployResult, adapter });
    const hasUnknown = observed.checks.some(({ status }) => status === "UNKNOWN");
    const allPassed = observed.checks.every(({ status }) => status === "PASSED");
    const status = allPassed ? "SUCCEEDED" : hasUnknown ? "UNKNOWN" : "FAILED";
    const changedResources = observed.route ? [{ type: "application", name: request.artifact.applicationId, change: "DEPLOYED", route: observed.route }] : [];
    const result = completedDeployment(request, { status, operationId, validation: observed.checks, changedResources });
    recordOperation(request.idempotencyKey, { status, operationId, startedAt, finishedAt: new Date().toISOString(), result });
    return result;
}

export const cloudFoundryProtocol = Object.freeze({
    id: "300",
    version: "1.0",
    scope: "DEPLOY_CF",
    status: "IMPLEMENTED",
    riskLevel: "EXTERNAL_CHANGE",
    requires: Object.freeze(["DEPLOYMENT_ARTIFACT", "CF_TARGET", "EXTERNAL_CHANGE_INTENT"]),
    produces: Object.freeze(["CF_DEPLOYMENT_RESULT"]),
    specPath: "specs/300-deploy-cloud-foundry/spec.md",
    validationCriteria: Object.freeze(["Deployment completes in the confirmed target", "Application health and routes are verified"]),
    executor: deployToCloudFoundry
});
