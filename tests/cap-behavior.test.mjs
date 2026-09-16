import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { runCapGeneration } from "../src/generation/backend/cap/generator.mjs";
import { createBehaviorPlan } from "../src/generation/backend/cap/behavior-plan.mjs";
import { createDomainPlan } from "../src/generation/backend/cap/domain-plan.mjs";
import { createServicePlan } from "../src/generation/backend/cap/service-plan.mjs";
import { validateCapHandoff } from "../src/generation/backend/cap/request-validator.mjs";
import { loadCapFixture, clone } from "./helpers/cap-contract.mjs";

test("CAP-RULES-01 renders stable validation and an atomic CAP transaction", async () => {
    const root = await mkdtemp(path.join(process.cwd(), ".fiori-agent-test-cap-rules-"));
    try {
        const handoff = await loadCapFixture("cap-rules-01");
        const result = await runCapGeneration(handoff, { workspaceRoot: root });
        assert.equal(result.status, "VALIDATED");
        const handler = await readFile(path.join(root, result.projectPath, "srv", "service.js"), "utf8");
        assert.match(handler, /INVALID_STOCK/);
        assert.match(handler, /cds\.tx\(req\)/);
        assert.match(handler, /await tx\.run/);
        const invalid = clone(handoff);
        invalid.inputs.behaviors[1].atomic = false;
        const validation = validateCapHandoff(invalid);
        const domain = createDomainPlan(invalid.inputs.domain, validation.requirementIds);
        const service = createServicePlan(invalid.inputs.services, domain, validation.requirementIds);
        assert.match(createBehaviorPlan(invalid.inputs.behaviors, service, validation.requirementIds).errors.join(" "), /atomic/i);
        const sql = clone(handoff);
        sql.inputs.behaviors[1].condition.query = "DELETE FROM Books";
        assert.match(createBehaviorPlan(sql.inputs.behaviors, service, validation.requirementIds).errors.join(" "), /SQL|executable/i);
    } finally { await rm(root, { recursive: true, force: true }); }
});
