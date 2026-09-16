import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { runCapGeneration } from "../src/generation/backend/cap/generator.mjs";
import { loadCapFixture, clone } from "./helpers/cap-contract.mjs";

test("CAP generation guard blocks credentials, path escape and existing output without writes", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "cap-guard-"));
    try {
        const source = await loadCapFixture("cap-crud-01");
        const credential = clone(source); credential.request.token = "synthetic-placeholder";
        assert.equal((await runCapGeneration(credential, { workspaceRoot: root })).status, "BLOCKED");
        const escape = clone(source); escape.inputs.project.outputParent = "../outside";
        assert.equal((await runCapGeneration(escape, { workspaceRoot: root })).status, "BLOCKED");
        await mkdir(path.join(root, "generated", source.inputs.project.name), { recursive: true });
        assert.equal((await runCapGeneration(source, { workspaceRoot: root })).status, "BLOCKED");
    } finally { await rm(root, { recursive: true, force: true }); }
});
