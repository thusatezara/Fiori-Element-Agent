import { randomUUID } from "node:crypto";
import { evaluateApprovalGate } from "./approval-gate.mjs";
import { getProtocol } from "./protocol-registry.mjs";
import { validateSolutionPlan } from "../validation/solution-plan.mjs";

const STEP_IDS = Object.freeze({
    BACKEND: "backend",
    FRONTEND: "frontend",
    PACKAGE: "package",
    DEPLOY_CF: "deploy-cf",
    PUBLISH_WORK_ZONE: "publish-work-zone"
});

function dependencies(scope, present) {
    if (scope === "FRONTEND" && present.has("BACKEND")) return [STEP_IDS.BACKEND];
    if (scope === "PACKAGE") return ["BACKEND", "FRONTEND"].filter((item) => present.has(item)).map((item) => STEP_IDS[item]);
    if (scope === "DEPLOY_CF") return present.has("PACKAGE") ? [STEP_IDS.PACKAGE] : [];
    if (scope === "PUBLISH_WORK_ZONE") return present.has("DEPLOY_CF") ? [STEP_IDS.DEPLOY_CF] : [];
    return [];
}

function readiness(protocol, request) {
    if (protocol.scope === "BACKEND" && !request.backend?.persistence) {
        return {
            readiness: "NEEDS_INPUT",
            blockingReasons: ["Which CAP database should be used: SQLITE for an in-memory demo or HANA for durable production persistence?"]
        };
    }
    if (protocol.riskLevel === "EXTERNAL_CHANGE") {
        const gate = evaluateApprovalGate(protocol.scope, request);
        if (!gate.ready) return { readiness: "NEEDS_INPUT", blockingReasons: gate.reasons };
    }
    if (protocol.status !== "IMPLEMENTED") {
        return {
            readiness: "NOT_IMPLEMENTED",
            blockingReasons: [`Protocol ${protocol.id} is defined but has no implemented executor.`]
        };
    }
    return { readiness: "READY", blockingReasons: [] };
}

function planStatus(steps) {
    if (steps.some(({ readiness: state }) => state === "NEEDS_INPUT")) return "NEEDS_INPUT";
    if (steps.some(({ readiness: state }) => state === "NOT_IMPLEMENTED")) return "PARTIALLY_IMPLEMENTED";
    if (steps.some(({ readiness: state }) => state === "BLOCKED")) return "BLOCKED";
    return "READY";
}

export function createSolutionPlan(request) {
    const present = new Set(request.scopes);
    const steps = request.scopes.map((scope) => {
        const descriptor = getProtocol(scope);
        const state = readiness(descriptor, request);
        return {
            id: STEP_IDS[scope],
            scope,
            protocol: {
                id: descriptor.id,
                version: descriptor.version,
                status: descriptor.status,
                specPath: descriptor.specPath
            },
            dependsOn: dependencies(scope, present),
            approval: descriptor.riskLevel,
            readiness: state.readiness,
            blockingReasons: state.blockingReasons,
            validationCriteria: [...descriptor.validationCriteria]
        };
    });

    const precedingSteps = new Map();
    for (const step of steps) {
        const unavailableDependencies = step.dependsOn.filter((dependencyId) => {
            const dependency = precedingSteps.get(dependencyId);
            return !dependency || dependency.readiness !== "READY";
        });
        if (step.readiness === "READY" && unavailableDependencies.length > 0) {
            step.readiness = "BLOCKED";
            step.blockingReasons = [
                `Dependencies are not ready: ${unavailableDependencies.join(", ")}.`
            ];
        }
        precedingSteps.set(step.id, step);
    }

    const plan = {
        planVersion: "1.0",
        planId: randomUUID(),
        request,
        steps,
        status: planStatus(steps),
        assumptions: present.has("PACKAGE") && !present.has("BACKEND") && !present.has("FRONTEND")
            ? ["A validated existing solution artifact will be supplied to protocol 200."]
            : [],
        exclusions: ["No Cloud Foundry or Work Zone changes are performed by solution planning."],
        createdAt: new Date().toISOString()
    };
    const validation = validateSolutionPlan(plan);
    if (!validation.passed) throw new Error(`Invalid solution plan: ${validation.errors.join("; ")}`);
    return plan;
}
