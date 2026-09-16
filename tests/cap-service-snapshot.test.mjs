import assert from "node:assert/strict";
import test from "node:test";
import { assertSnapshotConsistency } from "../src/generation/backend/cap/service-snapshot.mjs";

test("CAP-CONTRACT-01 rejects a snapshot that exposes a hidden persistence field", () => {
    const servicePlan = { services: [{ name: "AdminService", entities: [{ name: "Books", exposedElements: ["ID", "title"] }] }] };
    const snapshots = [{ serviceName: "AdminService", entitySets: [{ name: "Books", properties: [{ name: "ID" }, { name: "title" }, { name: "internalNote" }] }] }];
    const result = assertSnapshotConsistency(snapshots, servicePlan);
    assert.equal(result.passed, false);
    assert.match(result.errors.join(" "), /internalNote/);
});
