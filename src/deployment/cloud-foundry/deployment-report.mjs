import { randomUUID } from "node:crypto";

export function blockedDeployment(request, reasons, validation = []) {
    return {
        resultVersion: "1.0",
        resultId: randomUUID(),
        protocol: { id: "300", version: "1.0" },
        status: "BLOCKED",
        target: request.target,
        targetFingerprint: request.targetFingerprint ?? "0".repeat(64),
        operationId: null,
        applicationId: request.artifact?.applicationId ?? null,
        sapCloudService: request.artifact?.sapCloudService ?? null,
        artifactDigest: request.artifact?.archiveChecksum ?? "0".repeat(64),
        subaccount: null,
        verifiedAt: null,
        changedResources: [],
        validation,
        blockingReasons: reasons.map((message) => ({ code: "DEPLOYMENT_BLOCKED", message })),
        recoveryGuidance: []
    };
}

export function completedDeployment(request, { status, operationId, validation, changedResources = [] }) {
    return {
        resultVersion: "1.0",
        resultId: randomUUID(),
        protocol: { id: "300", version: "1.0" },
        status,
        target: request.target,
        targetFingerprint: request.targetFingerprint,
        operationId,
        applicationId: request.artifact.applicationId,
        sapCloudService: request.artifact.sapCloudService,
        artifactDigest: request.artifact.archiveChecksum,
        subaccount: request.target.org,
        verifiedAt: status === "SUCCEEDED" ? new Date().toISOString() : null,
        changedResources,
        validation,
        blockingReasons: [],
        recoveryGuidance: status === "SUCCEEDED" ? [] : [{ action: "Inspect the MTA operation and approve any retry or rollback separately.", requiresApproval: true }]
    };
}

