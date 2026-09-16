import { IDENTIFIER, assertRequirementRefs } from "./request-validator.mjs";

const CAPS = new Set(["READ", "CREATE", "UPDATE", "DELETE"]);
const SAFE_TYPE = /^(UUID|String|String\([1-9][0-9]*\)|Integer|Decimal\([1-9][0-9]*,[0-9]+\)|Boolean|Date|Timestamp|LargeString)$/;
const STANDARD_ASPECT_MEMBERS = Object.freeze({
    CUID: ["ID"],
    MANAGED: ["createdAt", "createdBy", "modifiedAt", "modifiedBy"]
});

function validateAuthorization(entries, requirementIds, label, errors) {
    for (const entry of entries ?? []) {
        if (!Array.isArray(entry.roles) || !entry.roles.length || entry.roles.some((role) => !/^[A-Za-z][A-Za-z0-9._-]*$/.test(role))) errors.push(`${label} authorization roles are invalid.`);
        if (!Array.isArray(entry.grant) || !entry.grant.length) errors.push(`${label} authorization grant is required.`);
        if (entry.where && Object.keys(entry.where).some((key) => !["field", "operator", "value"].includes(key))) errors.push(`${label} authorization where clause is not allowlisted.`);
        errors.push(...assertRequirementRefs([entry], requirementIds, `${label} authorization`));
    }
}

export function createServicePlan(services, domainPlan, requirementIds) {
    const errors = [];
    const serviceIds = new Set();
    const serviceNames = new Set();
    const planned = [];
    for (const service of services ?? []) {
        if (!service?.id || serviceIds.has(service.id)) errors.push("Service IDs must be unique.");
        if (!IDENTIFIER.test(service?.name ?? "") || serviceNames.has(service.name)) errors.push("Service names must be valid and unique.");
        if (!/^\/[A-Za-z0-9/_-]+$/.test(service?.path ?? "")) errors.push(`Service ${service?.name} path is invalid.`);
        serviceIds.add(service?.id); serviceNames.add(service?.name);
        errors.push(...assertRequirementRefs([service], requirementIds, `Service ${service?.id ?? "unknown"}`));
        validateAuthorization(service.authorization, requirementIds, `Service ${service?.name}`, errors);
        const entityNames = new Set();
        const plannedEntities = [];
        for (const exposed of service.entities ?? []) {
            const source = domainPlan.byId.get(exposed?.sourceEntityId);
            if (!source) errors.push(`Service entity ${exposed?.name} has an unresolved source.`);
            if (!IDENTIFIER.test(exposed?.name ?? "") || entityNames.has(exposed.name)) errors.push(`Service ${service.name} entity names must be valid and unique.`);
            entityNames.add(exposed?.name);
            const aspectMembers = (source?.aspects ?? []).flatMap((aspect) => STANDARD_ASPECT_MEMBERS[aspect] ?? []);
            const sourceMembers = new Set([...(source?.elements ?? []).map(({ name }) => name), ...(source?.relationships ?? []).map(({ name }) => name), ...aspectMembers]);
            for (const field of exposed?.exposedElements ?? []) if (!sourceMembers.has(field)) errors.push(`Service entity ${exposed.name} exposes unknown member ${field}.`);
            const keyNames = (source?.aspects ?? []).includes("CUID") ? ["ID"] : (source?.elements ?? []).filter(({ key }) => key).map(({ name }) => name);
            for (const key of keyNames) if (!exposed?.exposedElements?.includes(key)) errors.push(`Service entity ${exposed.name} must expose key ${key}.`);
            if (!Array.isArray(exposed?.capabilities) || !exposed.capabilities.length || exposed.capabilities.some((cap) => !CAPS.has(cap))) errors.push(`Service entity ${exposed?.name} capabilities are invalid.`);
            errors.push(...assertRequirementRefs([exposed], requirementIds, `Service entity ${exposed?.name}`));
            validateAuthorization(exposed.authorization, requirementIds, `Service entity ${exposed?.name}`, errors);
            plannedEntities.push({ ...structuredClone(exposed), source });
        }
        const operationNames = new Set();
        for (const operation of service.operations ?? []) {
            if (!IDENTIFIER.test(operation?.name ?? "") || operationNames.has(operation.name)) errors.push(`Service ${service.name} operation names must be valid and unique.`);
            operationNames.add(operation?.name);
            if (!new Set(["ACTION", "FUNCTION"]).has(operation?.kind)) errors.push(`Operation ${operation?.name} kind is invalid.`);
            if (operation?.kind === "FUNCTION" && operation.sideEffect) errors.push(`Function ${operation.name} cannot have side effects.`);
            if (operation?.boundTo && !entityNames.has(operation.boundTo)) errors.push(`Operation ${operation.name} has an unresolved binding.`);
            for (const parameter of operation?.parameters ?? []) if (!IDENTIFIER.test(parameter?.name ?? "") || !SAFE_TYPE.test(parameter?.type ?? "")) errors.push(`Operation ${operation.name} has an invalid parameter.`);
            if (operation?.returns && !SAFE_TYPE.test(operation.returns.type ?? "")) errors.push(`Operation ${operation.name} has an invalid return type.`);
            errors.push(...assertRequirementRefs([operation], requirementIds, `Operation ${operation?.name}`));
        }
        planned.push({ ...structuredClone(service), entities: plannedEntities });
    }
    return errors.length ? { passed: false, errors: [...new Set(errors)] } : { passed: true, errors: [], services: planned, byId: new Map(planned.map((service) => [service.id, service])) };
}
