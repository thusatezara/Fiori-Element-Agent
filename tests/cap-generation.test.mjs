import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { runCapGeneration } from "../src/generation/backend/cap/generator.mjs";
import { loadCapFixture } from "./helpers/cap-contract.mjs";

test("CAP-CRUD-01 generates, compiles, starts and returns a consumer snapshot", async () => {
    const root = await mkdtemp(path.join(process.cwd(), ".fiori-agent-test-cap-crud-"));
    try {
        const handoff = await loadCapFixture("cap-crud-01");
        const result = await runCapGeneration(handoff, { workspaceRoot: root });
        assert.equal(result.status, "VALIDATED", JSON.stringify(result.prerequisites));
        assert.equal(result.checks.length, 9);
        assert.ok(result.checks.every(({ status }) => status === "PASS"), JSON.stringify(result.checks));
        const snapshot = result.serviceSnapshots.find(({ serviceName }) => serviceName === "AdminService");
        const books = snapshot.entitySets.find(({ name }) => name === "Books");
        assert.ok(books.properties.some(({ name }) => name === "title"));
        assert.ok(!books.properties.some(({ name }) => name === "internalNote"));
        assert.match(await readFile(path.join(root, result.projectPath, "srv", "service.cds"), "utf8"), /projection on domain\.Books/);
    } finally { await rm(root, { recursive: true, force: true }); }
});
