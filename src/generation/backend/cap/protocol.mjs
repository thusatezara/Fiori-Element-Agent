import { runCapGeneration } from "./generator.mjs";

export const capProtocol = Object.freeze({
    id: "100",
    version: "1.0",
    scope: "BACKEND",
    status: "IMPLEMENTED",
    riskLevel: "LOCAL_WRITE",
    requires: Object.freeze(["DOMAIN_CONTRACT"]),
    produces: Object.freeze(["CAP_APPLICATION", "SERVICE_CONTRACT"]),
    specPath: "specs/100-generate-cap-application/spec.md",
    validationCriteria: Object.freeze(["CDS model compiles", "Service contract is available to protocol 001"]),
    invocation: "HANDOFF",
    executor: runCapGeneration
});
