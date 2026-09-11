import { getProtocol } from "../orchestration/protocol-registry.mjs";

export function validateSolutionPlan(plan) {
    const errors = [];
    if (plan?.planVersion !== "1.0") errors.push("Unsupported planVersion.");
    if (!plan?.request?.requestId) errors.push("Missing request reference.");
    if (!Array.isArray(plan?.steps) || plan.steps.length === 0) errors.push("At least one plan step is required.");

    const seen = new Set();
    for (const step of plan?.steps ?? []) {
        if (seen.has(step.id)) errors.push(`Duplicate step id: ${step.id}.`);
        for (const dependency of step.dependsOn ?? []) {
            if (!seen.has(dependency)) errors.push(`Step ${step.id} depends on unavailable or later step ${dependency}.`);
        }
        try {
            const descriptor = getProtocol(step.scope);
            if (descriptor.id !== step.protocol?.id) errors.push(`Step ${step.id} has a mismatched protocol.`);
        } catch (error) {
            errors.push(error.message);
        }
        if (step.readiness !== "READY" && (step.blockingReasons?.length ?? 0) === 0) {
            errors.push(`Step ${step.id} must explain why it is not ready.`);
        }
        seen.add(step.id);
    }

    return { passed: errors.length === 0, errors };
}
