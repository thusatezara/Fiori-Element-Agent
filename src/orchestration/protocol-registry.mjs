import { runGeneration } from "./generate.mjs";
import { capProtocol } from "../generation/backend/cap/protocol.mjs";
import { mtaProtocol } from "../composition/mta/protocol.mjs";
import { cloudFoundryProtocol } from "../deployment/cloud-foundry/protocol.mjs";
import { workZoneProtocol } from "../publication/work-zone/protocol.mjs";

const frontendProtocol = Object.freeze({
    id: "001",
    version: "1.0",
    scope: "FRONTEND",
    status: "IMPLEMENTED",
    riskLevel: "LOCAL_WRITE",
    requires: Object.freeze(["ODATA_SERVICE_CONTRACT"]),
    produces: Object.freeze(["UI_APPLICATION"]),
    specPath: "specs/001-classify-fiori-app-request/spec.md",
    validationCriteria: Object.freeze(["Protocol 001 selects exactly one of 002, 003 or 004", "Generated project validation passes"]),
    executor: runGeneration
});

const protocols = Object.freeze([
    frontendProtocol,
    capProtocol,
    mtaProtocol,
    cloudFoundryProtocol,
    workZoneProtocol
]);

function validateRegistry(entries) {
    const ids = new Set();
    const scopes = new Set();
    for (const protocol of entries) {
        if (ids.has(protocol.id)) throw new Error(`Duplicate protocol id: ${protocol.id}`);
        if (scopes.has(protocol.scope)) throw new Error(`Duplicate protocol scope: ${protocol.scope}`);
        if (protocol.status === "IMPLEMENTED" && typeof protocol.executor !== "function") {
            throw new Error(`Implemented protocol ${protocol.id} has no executor.`);
        }
        if (protocol.status !== "IMPLEMENTED" && protocol.executor !== null) {
            throw new Error(`Non-implemented protocol ${protocol.id} cannot expose an executor.`);
        }
        ids.add(protocol.id);
        scopes.add(protocol.scope);
    }
}

validateRegistry(protocols);

export function listProtocols() {
    return [...protocols];
}

export function getProtocol(scope) {
    const protocol = protocols.find((candidate) => candidate.scope === scope);
    if (!protocol) throw new Error(`No protocol is registered for scope ${scope}.`);
    return protocol;
}
