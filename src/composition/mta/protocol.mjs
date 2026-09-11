export const mtaProtocol = Object.freeze({
    id: "200",
    version: "1.0",
    scope: "PACKAGE",
    status: "DEFINED",
    riskLevel: "LOCAL_WRITE",
    requires: Object.freeze(["VALIDATED_SOLUTION_INPUT"]),
    produces: Object.freeze(["MTA_DESCRIPTOR", "DEPLOYMENT_ARTIFACT"]),
    specPath: "specs/200-compose-mta-solution/spec.md",
    validationCriteria: Object.freeze(["MTA module and resource references are valid", "Package build validation passes"]),
    executor: null
});
