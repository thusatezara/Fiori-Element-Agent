export const cloudFoundryProtocol = Object.freeze({
    id: "300",
    version: "1.0",
    scope: "DEPLOY_CF",
    status: "DEFINED",
    riskLevel: "EXTERNAL_CHANGE",
    requires: Object.freeze(["DEPLOYMENT_ARTIFACT", "CF_TARGET", "EXTERNAL_CHANGE_INTENT"]),
    produces: Object.freeze(["CF_DEPLOYMENT_RESULT"]),
    specPath: "specs/300-deploy-cloud-foundry/spec.md",
    validationCriteria: Object.freeze(["Deployment completes in the confirmed target", "Application health and routes are verified"]),
    executor: null
});
