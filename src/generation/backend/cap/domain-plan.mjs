import { IDENTIFIER, assertRequirementRefs } from "./request-validator.mjs";

const TYPES = new Set(["UUID", "STRING", "INTEGER", "DECIMAL", "BOOLEAN", "DATE", "TIMESTAMP", "LARGE_STRING"]);

export function createDomainPlan(domain, requirementIds) {
    const errors = [];
    const entities = domain?.entities ?? [];
    const byId = new Map();
    const names = new Set();
    for (const entity of entities) {
        if (!entity?.id || byId.has(entity.id)) errors.push("Domain entity IDs must be unique.");
        if (!IDENTIFIER.test(entity?.name ?? "") || names.has(entity.name)) errors.push("Domain entity names must be valid and unique.");
        byId.set(entity?.id, entity);
        names.add(entity?.name);
        errors.push(...assertRequirementRefs([entity], requirementIds, `Entity ${entity?.id ?? "unknown"}`));
        if (!Array.isArray(entity.aspects) || entity.aspects.some((aspect) => !new Set(["CUID", "MANAGED"]).has(aspect)) || new Set(entity.aspects).size !== entity.aspects.length) errors.push(`Entity ${entity?.name} aspects are invalid.`);
        const elementNames = new Set();
        let hasKey = (entity.aspects ?? []).includes("CUID");
        for (const element of entity.elements ?? []) {
            if (!IDENTIFIER.test(element?.name ?? "") || elementNames.has(element.name)) errors.push(`Entity ${entity.name} has an invalid or duplicate element.`);
            elementNames.add(element?.name);
            if (!TYPES.has(element?.type)) errors.push(`Unsupported type on ${entity.name}.${element?.name}.`);
            if (typeof element?.key !== "boolean" || typeof element?.nullable !== "boolean") errors.push(`Element ${entity.name}.${element?.name} key and nullable must be boolean.`);
            if (element?.type === "STRING" && (!Number.isInteger(element.length) || element.length < 1)) errors.push(`STRING ${entity.name}.${element.name} requires length.`);
            if (element?.type === "DECIMAL" && (!Number.isInteger(element.precision) || !Number.isInteger(element.scale) || element.precision <= element.scale || element.scale < 0)) errors.push(`DECIMAL ${entity.name}.${element.name} requires precision > scale >= 0.`);
            if (element?.key) hasKey = true;
            errors.push(...assertRequirementRefs([element], requirementIds, `Element ${entity.name}.${element?.name}`));
        }
        if (!hasKey) errors.push(`Entity ${entity.name} requires a key or CUID aspect.`);
    }
    for (const entity of entities) {
        const memberNames = new Set((entity.elements ?? []).map(({ name }) => name));
        for (const relationship of entity.relationships ?? []) {
            if (!IDENTIFIER.test(relationship?.name ?? "") || memberNames.has(relationship.name)) errors.push(`Entity ${entity.name} has an invalid or duplicate relationship.`);
            memberNames.add(relationship?.name);
            if (!byId.has(relationship?.targetEntityId)) errors.push(`Relationship ${entity.name}.${relationship?.name} has an unresolved target.`);
            if (!new Set(["ASSOCIATION", "COMPOSITION"]).has(relationship?.kind)) errors.push(`Relationship ${entity.name}.${relationship?.name} has invalid lifecycle semantics.`);
            if (!new Set(["TO_ONE", "TO_MANY"]).has(relationship?.cardinality)) errors.push(`Relationship ${entity.name}.${relationship?.name} has invalid cardinality.`);
            if (relationship?.cardinality === "TO_MANY" && (!relationship?.on || !IDENTIFIER.test(relationship.on.sourceField ?? "") || !IDENTIFIER.test(relationship.on.targetField ?? ""))) errors.push(`TO_MANY relationship ${entity.name}.${relationship?.name} requires an explicit sourceField/targetField on condition.`);
            errors.push(...assertRequirementRefs([relationship], requirementIds, `Relationship ${entity.name}.${relationship?.name}`));
        }
    }
    if (errors.length) return { passed: false, errors: [...new Set(errors)] };
    return { passed: true, errors: [], entities: structuredClone(entities), byId };
}

export function cdsType(element) {
    const types = { UUID: "UUID", STRING: `String(${element.length})`, INTEGER: "Integer", DECIMAL: `Decimal(${element.precision},${element.scale})`, BOOLEAN: "Boolean", DATE: "Date", TIMESTAMP: "Timestamp", LARGE_STRING: "LargeString" };
    return types[element.type];
}
