import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { runCapGeneration } from "../src/generation/backend/cap/generator.mjs";
import { clone, loadCapFixture, fakeCapValidation } from "./helpers/cap-contract.mjs";

test("CAP result contains every required check and a complete requirement trace", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "cap-result-"));
    try {
        const handoff = await loadCapFixture("cap-crud-01");
        const result = await runCapGeneration(handoff, { workspaceRoot: root, validator: async (_dir, plans) => fakeCapValidation(plans) });
        const expected = ["HANDOFF_SCHEMA", "DOMAIN_SEMANTICS", "OUTPUT_BOUNDARY", "CREDENTIAL_SCAN", "CDS_COMPILE", "CONTRACT_TEST", "HANDLER_TEST", "LOCAL_START", "SNAPSHOT_CONSISTENCY"];
        assert.deepEqual(new Set(result.checks.map(({ id }) => id)), new Set(expected));
        assert.deepEqual(new Set(result.trace.map(({ requirementId }) => requirementId)), new Set(handoff.inputs.requirements.map(({ id }) => id)));
        assert.ok(result.trace.every(({ artifacts, checks }) => artifacts.length && checks.length === expected.length));
    } finally { await rm(root, { recursive: true, force: true }); }
});

test("HANA intent generates explicit development SQLite and production HANA profiles", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "cap-hana-profile-"));
    try {
        const handoff = clone(await loadCapFixture("cap-crud-01"));
        handoff.inputs.project.name = "cap-hana-profile";
        handoff.inputs.project.persistence = "HANA";
        const result = await runCapGeneration(handoff, { workspaceRoot: root, validator: async (_dir, plans) => fakeCapValidation(plans) });
        assert.equal(result.status, "VALIDATED");
        const packageJson = JSON.parse(await readFile(path.join(root, result.projectPath, "package.json"), "utf8"));
        assert.equal(packageJson.dependencies["@cap-js/hana"], "^2.0.0");
        assert.equal(packageJson.devDependencies["@sap/cds-dk"], "^9.7.0");
        assert.equal(packageJson.cds.requires.db["[development]"].kind, "sqlite");
        assert.equal(packageJson.cds.requires.db["[production]"].kind, "hana");
    } finally { await rm(root, { recursive: true, force: true }); }
});
