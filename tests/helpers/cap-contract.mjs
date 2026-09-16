import { readFile } from "node:fs/promises";

export async function loadCapFixture(name) {
    const url = new URL(`../fixtures/cap/${name}.handoff.json`, import.meta.url);
    return JSON.parse(await readFile(url, "utf8"));
}

export async function loadCapSchemas() {
    const names = ["cap-generation-request", "cap-generation-result", "service-snapshot"];
    return Promise.all(names.map(async (name) => JSON.parse(await readFile(new URL(`../../specs/100-generate-cap-application/contracts/${name}.schema.json`, import.meta.url), "utf8"))));
}

export function clone(value) {
    return structuredClone(value);
}

export function fakeCapValidation(plans) {
    const metadataByService = new Map(plans.service.services.map(({ name }) => [name, `<edmx:Edmx Version="4.0"><DataServices Name="${name}"/></edmx:Edmx>`]));
    const serviceSnapshots = plans.service.services.map((service) => ({
        snapshotVersion: "1.0", odataVersion: "4.0", serviceName: service.name,
        serviceUrlHint: `${service.path}/`.replace("//", "/"),
        entitySets: service.entities.map((entity) => ({
            name: entity.name,
            keys: entity.source.aspects.includes("CUID") ? ["ID"] : entity.source.elements.filter(({ key }) => key).map(({ name }) => name),
            properties: entity.source.elements.filter(({ name }) => entity.exposedElements.includes(name)).map(({ name, type, nullable, length, precision, scale }) => ({ name, type: `Edm.${type}`, nullable, maxLength: length ?? null, precision: precision ?? null, scale: scale ?? null })),
            navigation: [], capabilities: [...entity.capabilities]
        })),
        operations: [], metadataPath: "gen/contract/metadata.xml", modelDigest: `sha256:${"a".repeat(64)}`
    }));
    return { passed: true, metadataByService, serviceSnapshots, checks: [
        { id: "CDS_COMPILE", required: true, status: "PASS", summary: "fixture compile", durationMs: 0 },
        { id: "CONTRACT_TEST", required: true, status: "PASS", summary: "fixture contract", durationMs: 0 },
        { id: "HANDLER_TEST", required: true, status: "PASS", summary: "fixture handler", durationMs: 0 },
        { id: "LOCAL_START", required: true, status: "PASS", summary: "fixture start", durationMs: 0 },
        { id: "SNAPSHOT_CONSISTENCY", required: true, status: "PASS", summary: "fixture snapshot", durationMs: 0 }
    ] };
}
