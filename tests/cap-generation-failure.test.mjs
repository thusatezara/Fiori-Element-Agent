import assert from "node:assert/strict";
import { access, mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { runCapGeneration } from "../src/generation/backend/cap/generator.mjs";
import { loadCapFixture } from "./helpers/cap-contract.mjs";

test("CAP validation failure removes staging and does not publish a snapshot", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "cap-fail-"));
    try {
        const handoff = await loadCapFixture("cap-crud-01");
        const validator = async () => ({ passed: false, serviceSnapshots: [], metadataByService: new Map(), checks: [{ id: "CDS_COMPILE", required: true, status: "FAIL", summary: "synthetic compile failure", durationMs: 0 }] });
        const result = await runCapGeneration(handoff, { workspaceRoot: root, validator });
        assert.equal(result.status, "FAILED");
        assert.deepEqual(result.serviceSnapshots, []);
        await assert.rejects(access(path.join(root, "generated", handoff.inputs.project.name)));
    } finally { await rm(root, { recursive: true, force: true }); }
});
