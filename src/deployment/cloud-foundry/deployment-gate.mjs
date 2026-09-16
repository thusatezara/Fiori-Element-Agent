import { randomUUID } from "node:crypto";
import { access } from "node:fs/promises";
import { hashPath } from "../../composition/mta/component-result-adapter.mjs";
import { validateDeploymentRequest } from "./contract.mjs";
import { inspectPrerequisites } from "./prerequisite-inspector.mjs";
import { inspectTarget, targetFingerprint } from "./target-inspector.mjs";

const APPROVAL_MAX_AGE_MS = 15 * 60 * 1000;

export async function createDeploymentPreflight({ artifact, target }, { adapter }) {
    const checks = [];
    try {
        await access(artifact.archivePath);
        const currentChecksum = await hashPath(artifact.archivePath);
        checks.push({ name: "artifact-checksum", status: currentChecksum === artifact.archiveChecksum ? "PASSED" : "FAILED" });
    } catch {
        checks.push({ name: "artifact-checksum", status: "FAILED" });
    }
    const targetCheck = await inspectTarget(target, adapter);
    checks.push({ name: "target", status: targetCheck.passed ? "PASSED" : "FAILED" });
    checks.push(...await inspectPrerequisites(adapter, artifact.serviceRequirements ?? []));
    const status = checks.every(({ status: value }) => value === "PASSED") ? "READY_FOR_APPROVAL" : "BLOCKED";
    return {
        snapshotId: randomUUID(),
        targetFingerprint: targetFingerprint(target),
        artifactChecksum: artifact.archiveChecksum,
        target: targetCheck.requested,
        observedTarget: targetCheck.observed,
        checks,
        createdAt: new Date().toISOString(),
        status
    };
}

function approvalErrors(request) {
    const errors = [];
    const snapshot = request.preflightSnapshot;
    const approval = request.approval;
    const fingerprint = targetFingerprint(request.target);
    if (snapshot.status !== "READY_FOR_APPROVAL") errors.push("Preflight snapshot is not ready for approval.");
    if (snapshot.targetFingerprint !== fingerprint || snapshot.artifactChecksum !== request.artifact.archiveChecksum) errors.push("Preflight snapshot does not match target/artifact.");
    if (approval.scope !== "DEPLOY_CF" || approval.targetFingerprint !== fingerprint || approval.artifactChecksum !== request.artifact.archiveChecksum || approval.snapshotId !== snapshot.snapshotId) errors.push("Approval is not bound to the current preflight snapshot.");
    if (Date.now() - Date.parse(snapshot.createdAt) > APPROVAL_MAX_AGE_MS || Date.now() - Date.parse(approval.approvedAt) > APPROVAL_MAX_AGE_MS) errors.push("Preflight or approval has expired.");
    if (request.target.stage === "PROD") {
        const production = request.productionApproval;
        if (!production || production.scope !== "DEPLOY_CF_PROD" || production.targetFingerprint !== fingerprint || production.artifactChecksum !== request.artifact.archiveChecksum || production.snapshotId !== snapshot.snapshotId) errors.push("A matching production approval is required.");
    }
    return errors;
}

export async function validateExecutionGate(request, { adapter }) {
    const contract = validateDeploymentRequest(request);
    if (!contract.passed) return { passed: false, errors: contract.errors };
    const approval = approvalErrors(request);
    if (approval.length) return { passed: false, errors: approval };
    const recheck = await createDeploymentPreflight({ artifact: request.artifact, target: request.target }, { adapter });
    if (recheck.status !== "READY_FOR_APPROVAL") return { passed: false, errors: ["Execution-time preflight failed."], snapshot: recheck };
    return { passed: true, errors: [], snapshot: recheck };
}

