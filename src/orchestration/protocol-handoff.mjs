import { randomUUID } from "node:crypto";
import { containsCredential } from "./approval-gate.mjs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validateProtocolHandoff(handoff, step) {
    const errors = [];
    if (handoff?.handoffVersion !== "1.0") errors.push("Unsupported handoffVersion.");
    if (!UUID.test(handoff?.handoffId ?? "")) errors.push("Missing or invalid handoffId.");
    if (!UUID.test(handoff?.planId ?? "")) errors.push("Missing or invalid planId.");
    if (handoff?.stepId !== step?.id) errors.push("Handoff stepId does not match the solution step.");
    if (handoff?.protocol?.id !== step?.protocol?.id || handoff?.protocol?.version !== step?.protocol?.version) {
        errors.push("Handoff protocol does not match the solution step.");
    }
    if (!handoff?.request || typeof handoff.request !== "object" || Array.isArray(handoff.request)) {
        errors.push("Handoff request must be an object.");
    }
    if (!handoff?.inputs || typeof handoff.inputs !== "object" || Array.isArray(handoff.inputs)) {
        errors.push("Handoff inputs must be an object.");
    }
    if (handoff?.target !== null && (typeof handoff?.target !== "object" || Array.isArray(handoff.target))) {
        errors.push("Handoff target must be an object or null.");
    }
    if (!Array.isArray(handoff?.completedDependencies) || handoff.completedDependencies.some((item) => typeof item !== "string")) {
        errors.push("completedDependencies must be an array of step IDs.");
    } else {
        const allowed = new Set(step?.dependsOn ?? []);
        const unknown = handoff.completedDependencies.filter((item) => !allowed.has(item));
        if (unknown.length > 0) errors.push(`Unknown completed dependencies: ${unknown.join(", ")}.`);
    }
    if (Number.isNaN(Date.parse(handoff?.requestedAt ?? ""))) errors.push("requestedAt must be an ISO date-time.");
    if (containsCredential(handoff)) errors.push("Protocol handoff must not contain credential values.");
    return { passed: errors.length === 0, errors };
}

export function createProtocolHandoff(plan, stepId, options = {}) {
    const step = plan?.steps?.find((candidate) => candidate.id === stepId);
    if (!step) throw new Error(`Unknown solution step: ${stepId}.`);
    const handoff = {
        handoffVersion: "1.0",
        handoffId: randomUUID(),
        planId: plan.planId,
        stepId: step.id,
        protocol: { id: step.protocol.id, version: step.protocol.version },
        request: plan.request,
        inputs: options.inputs ?? {},
        target: options.target ?? null,
        completedDependencies: options.completedDependencies ?? [],
        requestedAt: new Date().toISOString()
    };
    const validation = validateProtocolHandoff(handoff, step);
    if (!validation.passed) throw new Error(`Invalid protocol handoff: ${validation.errors.join("; ")}`);
    return handoff;
}
