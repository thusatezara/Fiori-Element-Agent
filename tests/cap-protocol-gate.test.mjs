import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { getProtocol } from "../src/orchestration/protocol-registry.mjs";
import { normalizeSolutionRequest } from "../src/orchestration/solution-request.mjs";
import { createSolutionPlan } from "../src/orchestration/solution-plan.mjs";
import { createProtocolHandoff } from "../src/orchestration/protocol-handoff.mjs";
import { executeProtocolStep } from "../src/orchestration/workflow-executor.mjs";
import { loadCapFixture } from "./helpers/cap-contract.mjs";

test("CAP protocol gate exposes an executor only with IMPLEMENTED status", () => {
    const protocol = getProtocol("BACKEND");
    assert.equal(protocol.status, "IMPLEMENTED");
    assert.equal(protocol.invocation, "HANDOFF");
    assert.equal(typeof protocol.executor, "function");
});

test("000 executes a valid Protocol 100 handoff and returns its validated result", async () => {
    const tempRoot = await mkdtemp(path.join(process.cwd(), ".fiori-agent-test-cap-gate-"));
    try {
        const fixture = await loadCapFixture("cap-crud-01");
        fixture.inputs.project.outputParent = path.relative(process.cwd(), tempRoot).replaceAll("\\", "/");
        fixture.inputs.project.name = "gate-backend";
        const request = normalizeSolutionRequest({ request: "CAP backend를 만들어줘", backend: { persistence: "SQLITE" } });
        const plan = createSolutionPlan(request);
        const step = plan.steps.find(({ scope }) => scope === "BACKEND");
        assert.equal(step.readiness, "READY");
        const handoff = createProtocolHandoff(plan, step.id, { inputs: fixture.inputs });
        const execution = await executeProtocolStep(step, handoff);
        assert.equal(execution.status, "COMPLETED");
        assert.equal(execution.result.status, "VALIDATED", JSON.stringify(execution.result.checks));
    } finally { await rm(tempRoot, { recursive: true, force: true }); }
});
