import { getProtocol } from "./protocol-registry.mjs";
import { validateProtocolHandoff } from "./protocol-handoff.mjs";

export async function executeProtocolStep(step, handoff) {
    const descriptor = getProtocol(step.scope);
    if (step.readiness === "NEEDS_INPUT" || step.readiness === "BLOCKED") {
        return {
            status: "BLOCKED",
            code: "PREREQUISITE_MISSING",
            protocolId: descriptor.id,
            retryable: true,
            reasons: [...(step.blockingReasons ?? [])]
        };
    }
    if (descriptor.status !== "IMPLEMENTED" || typeof descriptor.executor !== "function") {
        return {
            status: "BLOCKED",
            code: "PROTOCOL_NOT_IMPLEMENTED",
            protocolId: descriptor.id,
            retryable: false,
            reasons: [`Protocol ${descriptor.id} is ${descriptor.status} and has no executor.`]
        };
    }
    const handoffValidation = validateProtocolHandoff(handoff, step);
    if (!handoffValidation.passed) {
        return {
            status: "BLOCKED",
            code: "INVALID_HANDOFF",
            protocolId: descriptor.id,
            retryable: true,
            reasons: handoffValidation.errors
        };
    }
    const completedDependencies = new Set(handoff?.completedDependencies ?? []);
    const missingDependencies = (step.dependsOn ?? []).filter(
        (dependencyId) => !completedDependencies.has(dependencyId)
    );
    if (missingDependencies.length > 0) {
        return {
            status: "BLOCKED",
            code: "PREREQUISITE_MISSING",
            protocolId: descriptor.id,
            retryable: true,
            reasons: [`Missing completed dependencies: ${missingDependencies.join(", ")}.`]
        };
    }
    const result = await descriptor.executor(handoff.inputs);
    return { status: "COMPLETED", protocolId: descriptor.id, result };
}
