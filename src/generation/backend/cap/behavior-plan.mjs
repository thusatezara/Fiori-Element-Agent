import { assertRequirementRefs } from "./request-validator.mjs";

const OPERATORS = new Set(["REQUIRED", "EQ", "NE", "GT", "GTE", "LT", "LTE"]);
const EVENTS = new Set(["CREATE", "READ", "UPDATE", "DELETE", "ACTION"]);

function rejectUnsafe(value, errors) {
    if (!value || typeof value !== "object") return;
    for (const [key, child] of Object.entries(value)) {
        if (/code|sql|script|command/i.test(key)) errors.push("Behavior input contains a non-allowlisted executable field.");
        if (typeof child === "string" && /\b(select|insert|update|delete|drop|alter)\b.+\b(from|into|table|set)\b/i.test(child)) errors.push("Raw SQL is not allowed in behavior input.");
        if (child && typeof child === "object") rejectUnsafe(child, errors);
    }
}

export function createBehaviorPlan(behaviors = [], servicePlan, requirementIds) {
    const errors = [];
    const ids = new Set();
    const planned = [];
    for (const behavior of behaviors) {
        if (!behavior?.id || ids.has(behavior.id)) errors.push("Behavior IDs must be unique.");
        ids.add(behavior?.id);
        const service = servicePlan.byId.get(behavior?.serviceId);
        if (!service) errors.push(`Behavior ${behavior?.id} has an unresolved service.`);
        if (!new Set(["VALIDATION", "ACTION", "TRANSACTION"]).has(behavior?.kind)) errors.push(`Behavior ${behavior?.id} kind is invalid.`);
        if (!Array.isArray(behavior?.events) || !behavior.events.length || behavior.events.some((event) => !EVENTS.has(event))) errors.push(`Behavior ${behavior?.id} events are invalid.`);
        if ((behavior?.kind === "TRANSACTION" || behavior?.kind === "ACTION") && !behavior.atomic) errors.push(`Behavior ${behavior?.id} must be atomic.`);
        if (behavior?.kind === "VALIDATION") {
            if (!behavior.condition?.field || !OPERATORS.has(behavior.condition?.operator)) errors.push(`Validation ${behavior?.id} condition is invalid.`);
            if (!behavior.error?.code || !behavior.error?.message) errors.push(`Validation ${behavior?.id} requires a stable error.`);
        }
        if (behavior?.kind !== "VALIDATION" && !Array.isArray(behavior.condition?.statements)) errors.push(`Behavior ${behavior?.id} requires structured statements.`);
        for (const statement of behavior?.condition?.statements ?? []) {
            if (statement?.op !== "UPDATE" || !statement.entity || !statement.where?.field || !statement.where?.parameter || !statement.set?.field || !statement.set?.decrementParameter) errors.push(`Behavior ${behavior?.id} has a non-allowlisted statement.`);
        }
        if (service) {
            const targets = new Set([...service.entities.map(({ name }) => name), ...service.operations.map(({ name }) => name)]);
            if (!targets.has(behavior?.target)) errors.push(`Behavior ${behavior?.id} target is unresolved.`);
            const operation = service.operations.find(({ name }) => name === behavior?.target);
            if (operation?.destructive && behavior.kind !== "VALIDATION" && !behavior.condition?.confirmedDestructiveIntent) errors.push(`Destructive operation ${operation.name} lacks confirmed intent.`);
        }
        rejectUnsafe(behavior?.condition, errors);
        errors.push(...assertRequirementRefs([behavior], requirementIds, `Behavior ${behavior?.id}`));
        planned.push(structuredClone(behavior));
    }
    return errors.length ? { passed: false, errors: [...new Set(errors)] } : { passed: true, errors: [], behaviors: planned };
}
