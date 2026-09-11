export const workZoneProtocol = Object.freeze({
    id: "400",
    version: "1.0",
    scope: "PUBLISH_WORK_ZONE",
    status: "DEFINED",
    riskLevel: "EXTERNAL_CHANGE",
    requires: Object.freeze(["CF_DEPLOYMENT_RESULT", "WORK_ZONE_TARGET", "EXTERNAL_CHANGE_INTENT"]),
    produces: Object.freeze(["WORK_ZONE_PUBLICATION_RESULT"]),
    specPath: "specs/400-publish-work-zone/spec.md",
    validationCriteria: Object.freeze(["Content provider contains the application", "Site assignment and tile navigation are verified"]),
    executor: null
});
