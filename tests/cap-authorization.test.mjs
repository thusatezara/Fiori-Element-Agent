import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { runCapGeneration } from "../src/generation/backend/cap/generator.mjs";
import { loadCapFixture } from "./helpers/cap-contract.mjs";

test("CAP-AUTH-01 renders only the approved reader role and no cloud identity resource", async () => {
    const root = await mkdtemp(path.join(process.cwd(), ".fiori-agent-test-cap-auth-"));
    try {
        const result = await runCapGeneration(await loadCapFixture("cap-auth-01"), { workspaceRoot: root });
        assert.equal(result.status, "VALIDATED");
        const service = await readFile(path.join(root, result.projectPath, "srv", "service.cds"), "utf8");
        assert.match(service, /CatalogReader/);
        assert.match(service, /@readonly/);
        assert.ok(!result.files.some(({ path: filePath }) => /xs-security|mta\.yaml/i.test(filePath)));
        const cds = (await import("@sap/cds")).default;
        const csn = await cds.load(["db", "srv"], { root: path.join(root, result.projectPath) });
        assert.deepEqual(csn.definitions["CatalogService.Books"]["@restrict"][0].to, ["CatalogReader"]);
    } finally { await rm(root, { recursive: true, force: true }); }
});
