import { createHash } from "node:crypto";

const EDM_TYPES = {
    "cds.UUID": "Edm.Guid",
    "cds.String": "Edm.String",
    "cds.Integer": "Edm.Int32",
    "cds.Decimal": "Edm.Decimal",
    "cds.Boolean": "Edm.Boolean",
    "cds.Date": "Edm.Date",
    "cds.Timestamp": "Edm.DateTimeOffset",
    "cds.LargeString": "Edm.String"
};

function property(element, name) {
    return {
        name,
        type: EDM_TYPES[element.type] ?? element.type ?? "Edm.String",
        nullable: element.notNull !== true && element.key !== true,
        maxLength: element.length ?? null,
        precision: element.precision ?? null,
        scale: element.scale ?? null
    };
}

export function createServiceSnapshots(csn, servicePlan, metadataByService) {
    return servicePlan.services.map((service, index) => {
        const entitySets = service.entities.map((entity) => {
            const definition = csn.definitions[`${service.name}.${entity.name}`];
            if (!definition) throw new Error(`Compiled service entity is missing: ${service.name}.${entity.name}.`);
            const properties = [];
            const navigation = [];
            for (const [name, element] of Object.entries(definition.elements ?? {})) {
                if (element.target) {
                    navigation.push({ name, target: element.target.split(".").at(-1), cardinality: element.cardinality?.max === "*" ? "TO_MANY" : "TO_ONE" });
                } else {
                    properties.push(property(element, name));
                }
            }
            const keys = properties.filter(({ name }) => definition.elements[name]?.key).map(({ name }) => name);
            if (!keys.length) throw new Error(`Compiled service entity has no public key: ${service.name}.${entity.name}.`);
            return { name: entity.name, keys, properties, navigation, capabilities: [...entity.capabilities] };
        });
        const metadata = metadataByService.get(service.name);
        return {
            snapshotVersion: "1.0",
            odataVersion: "4.0",
            serviceName: service.name,
            serviceUrlHint: `${service.path.replace(/\/$/, "")}/`,
            entitySets,
            operations: service.operations.map(({ name, kind, boundTo, parameters, returns }) => ({ name, kind, boundTo, parameters, returns })),
            metadataPath: index === 0 ? "gen/contract/metadata.xml" : `gen/contract/metadata-${index + 1}.xml`,
            modelDigest: `sha256:${createHash("sha256").update(metadata).digest("hex")}`
        };
    });
}

export function assertSnapshotConsistency(snapshots, servicePlan) {
    const errors = [];
    for (const service of servicePlan.services) {
        const snapshot = snapshots.find(({ serviceName }) => service.name === serviceName);
        if (!snapshot) { errors.push(`Missing snapshot for ${service.name}.`); continue; }
        for (const entity of service.entities) {
            const exposed = snapshot.entitySets.find(({ name }) => name === entity.name);
            if (!exposed) { errors.push(`Missing snapshot entity ${service.name}.${entity.name}.`); continue; }
            const allowed = new Set(entity.exposedElements);
            for (const property of exposed.properties) {
                const generatedForeignKey = property.name.includes("_") && entity.exposedElements.some((name) => property.name.startsWith(`${name}_`));
                if (!allowed.has(property.name) && !generatedForeignKey) errors.push(`Snapshot exposes unapproved property ${entity.name}.${property.name}.`);
            }
        }
    }
    return { passed: errors.length === 0, errors };
}
