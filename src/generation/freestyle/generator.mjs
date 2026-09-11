import { renderFiles, renderTemplate } from "../../generation/common/template-renderer.mjs";
import { createStandardDecision } from "../standard/decision.mjs";
import { planFlow } from "./flow-planner.mjs";
import { planState } from "./state-planner.mjs";
import { planValidation } from "./validation-planner.mjs";
import { enforceBackendBoundary } from "./backend-boundary.mjs";

export async function generateFreestyleProject(context) {
    if (context.service.odataVersion !== "4.0") throw new Error("Freestyle SAPUI5 generation requires OData V4 in this generator; reclassify the request for a supported Standard flow.");
    const boundary = enforceBackendBoundary(context.request);
    const decision = createStandardDecision(context);
    const flow = planFlow(context.request);
    const state = planState(context.service, flow);
    const validationPlan = planValidation(context.request);
    const manifest = createManifest(context, flow);
    const columnsMarkup = decision.columns.map((property) => `      <Column><Text text="{i18n>${property.name}}" /></Column>`).join("\n");
    const cellsMarkup = decision.columns.map((property) => `          <Text text="{${property.name}}" />`).join("\n");
    const values = {
        projectName: context.projectName,
        namespace: context.namespace,
        appTitle: decision.humanizedEntity,
        appDescription: `Freestyle SAPUI5 application for ${context.service.entitySet}`,
        serviceRoot: context.service.serviceRoot,
        servicePath: context.service.servicePath,
        origin: context.service.origin,
        backendPath: context.service.servicePath.replace(/\/$/, "") || "/",
        odataVersion: context.service.odataVersion,
        entitySet: context.service.entitySet,
        entityType: context.service.entityType,
        keys: context.service.keys.join(", "),
        properties: context.service.properties.map((property) => property.name).join(", "),
        manifestJson: JSON.stringify(manifest, null, 2),
        i18nProperties: decision.columns.map((property) => `${property.name}=${property.label}`).join("\n"),
        columnsMarkup,
        cellsMarkup,
        stateJson: JSON.stringify(state.initialState, null, 2),
        flowJson: JSON.stringify(flow, null, 2),
        validationJson: JSON.stringify(validationPlan, null, 2),
        boundaryRule: boundary.rule
    };
    const files = await renderFiles("freestyle", {
        ".gitignore": ".gitignore.hbs",
        "package.json": "package.json.hbs",
        "ui5.yaml": "ui5.yaml.hbs",
        "ui5-mock.yaml": "ui5-mock.yaml.hbs",
        "webapp/index.html": "index.html.hbs",
        "webapp/Component.js": "webapp/Component.js.hbs",
        "webapp/manifest.json": "webapp/manifest.json.hbs",
        "webapp/model/models.js": "webapp/model/models.js.hbs",
        "webapp/view/View.view.xml": "webapp/view/View.view.xml.hbs",
        "webapp/controller/View.controller.js": "webapp/controller/View.controller.js.hbs",
        "webapp/controller/ErrorHandlers.js": "webapp/controller/ErrorHandlers.js.hbs",
        "webapp/i18n/i18n.properties": "webapp/i18n/i18n.properties.hbs",
        "webapp/test/unit/Controller.qunit.js": "webapp/test/unit/Controller.qunit.js.hbs",
        "webapp/test/integration/FlowJourney.js": "webapp/test/integration/FlowJourney.js.hbs",
        "scripts/validate.mjs": "scripts/validate.mjs.hbs",
        "README.md": "README.md.hbs"
    }, values);
    if (flow.screens.includes("review")) {
        files.set("webapp/view/Review.view.xml", await renderTemplate("freestyle", "webapp/view/Review.view.xml.hbs", values));
    }
    return { profile: "freestyle", files, columns: decision.columns, filters: [], details: { flow, state, validation: validationPlan, backendBoundary: boundary } };
}

function createManifest(context, flow) {
    const targets = Object.fromEntries(flow.screens.map((screen) => [screen, { viewName: screen === "main" ? "View" : "Review", viewLevel: screen === "main" ? 1 : 2 }]));
    const routes = flow.screens.map((screen) => ({ pattern: screen === "main" ? "" : screen, name: screen, target: screen }));
    return {
        "sap.app": {
            id: context.namespace,
            type: "application",
            i18n: "i18n/i18n.properties",
            applicationVersion: { version: "1.0.0" },
            title: `Freestyle ${context.service.entitySet}`,
            description: `Freestyle SAPUI5 application for ${context.service.entitySet}`,
            dataSources: { mainService: { uri: context.service.servicePath, type: "OData", settings: { odataVersion: "4.0" } } }
        },
        "sap.ui": { technology: "UI5", deviceTypes: { desktop: true, tablet: true, phone: true } },
        "sap.ui5": {
            flexEnabled: false,
            dependencies: { libs: { "sap.m": {}, "sap.ui.core": {} } },
            models: {
                i18n: { type: "sap.ui.model.resource.ResourceModel", settings: { bundleName: `${context.namespace}.i18n.i18n` } },
                "": { dataSource: "mainService", preload: true, settings: { operationMode: "Server", autoExpandSelect: true, earlyRequests: true } }
            },
            routing: { config: { routerClass: "sap.m.routing.Router", viewType: "XML", viewPath: `${context.namespace}.view`, controlId: "app", controlAggregation: "pages" }, routes, targets },
            rootView: { viewName: `${context.namespace}.view.View`, type: "XML", async: true, id: "app" }
        }
    };
}
