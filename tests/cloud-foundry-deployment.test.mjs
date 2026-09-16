import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { hashPath } from "../src/composition/mta/component-result-adapter.mjs";
import { createDeploymentPreflight, deployToCloudFoundry } from "../src/deployment/cloud-foundry/protocol.mjs";
import { clearOperations } from "../src/deployment/cloud-foundry/operation-tracker.mjs";
import { createFakeCfAdapter } from "./helpers/fake-cf-adapter.mjs";

async function deploymentFixture(adapter = createFakeCfAdapter()) {
    const root = await mkdtemp(path.join(os.tmpdir(), "cf-protocol-"));
    const archivePath = path.join(root, "demo.mtar");
    await writeFile(archivePath, "archive");
    const artifact = { artifactId: randomUUID(), status: "READY", archivePath, archiveChecksum: await hashPath(archivePath), descriptorFingerprint: "b".repeat(64), validation: [{ name: "archive", status: "PASSED" }], serviceRequirements: [], applicationId: "demo-app", sapCloudService: "demo-app" };
    const target = { api: "https://api.cf.example.test", org: "demo-org", space: "dev", stage: "DEV" };
    const preflightSnapshot = await createDeploymentPreflight({ artifact, target }, { adapter });
    const approval = { approvalId: randomUUID(), scope: "DEPLOY_CF", targetFingerprint: preflightSnapshot.targetFingerprint, artifactChecksum: artifact.archiveChecksum, snapshotId: preflightSnapshot.snapshotId, approvedAt: new Date().toISOString() };
    return { adapter, artifact, target, preflightSnapshot, approval };
}

test("300 preflight verifies target, session, plugin, role and artifact", async () => {
    const { preflightSnapshot } = await deploymentFixture();
    assert.equal(preflightSnapshot.status, "READY_FOR_APPROVAL");
    assert.ok(preflightSnapshot.checks.every(({ status }) => status === "PASSED"));
});

test("300 binds approval, deploys once per idempotency key and validates health/route", async () => {
    clearOperations();
    const fixture = await deploymentFixture();
    const request = { handoffVersion: "1.0", handoffId: randomUUID(), planId: randomUUID(), stepId: "deploy-cf", protocol: { id: "300", version: "1.0" }, completedDependencies: ["package"], requestedAt: new Date().toISOString(), deployIntent: true, idempotencyKey: randomUUID(), ...fixture };
    delete request.adapter;
    const first = await deployToCloudFoundry(request, { adapter: fixture.adapter });
    const second = await deployToCloudFoundry(request, { adapter: fixture.adapter });
    assert.equal(first.status, "SUCCEEDED");
    assert.equal(second.resultId, first.resultId);
    assert.equal(fixture.adapter.calls.filter(([command]) => command === "deploy").length, 1);
});

test("300 blocks mismatched approval and does not deploy", async () => {
    clearOperations();
    const fixture = await deploymentFixture();
    const request = { handoffVersion: "1.0", handoffId: randomUUID(), planId: randomUUID(), stepId: "deploy-cf", protocol: { id: "300", version: "1.0" }, completedDependencies: ["package"], requestedAt: new Date().toISOString(), deployIntent: true, idempotencyKey: randomUUID(), artifact: fixture.artifact, target: fixture.target, preflightSnapshot: fixture.preflightSnapshot, approval: { ...fixture.approval, snapshotId: randomUUID() } };
    const result = await deployToCloudFoundry(request, { adapter: fixture.adapter });
    assert.equal(result.status, "BLOCKED");
    assert.equal(fixture.adapter.calls.filter(([command]) => command === "deploy").length, 0);
});

test("300 reports failure without retry or rollback", async () => {
    clearOperations();
    const adapter = createFakeCfAdapter({ deployCode: 1, appHealthy: false });
    const fixture = await deploymentFixture(adapter);
    const request = { handoffVersion: "1.0", handoffId: randomUUID(), planId: randomUUID(), stepId: "deploy-cf", protocol: { id: "300", version: "1.0" }, completedDependencies: ["package"], requestedAt: new Date().toISOString(), deployIntent: true, idempotencyKey: randomUUID(), artifact: fixture.artifact, target: fixture.target, preflightSnapshot: fixture.preflightSnapshot, approval: fixture.approval };
    const result = await deployToCloudFoundry(request, { adapter });
    assert.equal(result.status, "FAILED");
    assert.equal(result.recoveryGuidance[0].requiresApproval, true);
    assert.equal(adapter.calls.filter(([command]) => ["deploy", "rollback-mta", "undeploy"].includes(command)).length, 1);
});

test("300 requires a separate matching approval for PROD", async () => {
    clearOperations();
    const adapter = createFakeCfAdapter();
    const fixture = await deploymentFixture(adapter);
    const target = { ...fixture.target, stage: "PROD" };
    const preflightSnapshot = await createDeploymentPreflight({ artifact: fixture.artifact, target }, { adapter });
    const approval = { ...fixture.approval, targetFingerprint: preflightSnapshot.targetFingerprint, snapshotId: preflightSnapshot.snapshotId };
    const request = { handoffVersion: "1.0", handoffId: randomUUID(), planId: randomUUID(), stepId: "deploy-cf", protocol: { id: "300", version: "1.0" }, completedDependencies: ["package"], requestedAt: new Date().toISOString(), deployIntent: true, idempotencyKey: randomUUID(), artifact: fixture.artifact, target, preflightSnapshot, approval };
    const result = await deployToCloudFoundry(request, { adapter });
    assert.equal(result.status, "BLOCKED");
    assert.match(result.blockingReasons.map(({ message }) => message).join(" "), /production approval/i);
});

