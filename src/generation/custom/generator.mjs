import { renderFiles, renderTemplate } from "../../generation/common/template-renderer.mjs";
import { createAnnotationXml } from "../standard/annotation-plan.mjs";
import { createStandardDecision } from "../standard/decision.mjs";
import { createCustomDecision } from "./decision.mjs";
import { planRegions } from "./region-planner.mjs";
import { planBuildingBlocks } from "./building-block-planner.mjs";
import { createDirectRegionPolicy } from "./direct-region-policy.mjs";
import { createFlpNavigation, createFlpSandboxConfig } from "../common/flp-navigation.mjs";

export async function generateCustomProject(context) {
    const customDecision = createCustomDecision(context);
    const standardDecision = createStandardDecision(context);
    const regions = planRegions(context.request, context.service);
    const buildingBlocks = planBuildingBlocks(context.service, regions);
    const directPolicy = createDirectRegionPolicy(regions);
    const flpNavigation = createFlpNavigation(context);
    const manifest = createCustomManifest(context, customDecision, flpNavigation);
    const annotationXml = createAnnotationXml({ service: context.service, ...standardDecision });
    const values = createValues(context, standardDecision, customDecision, regions, buildingBlocks, directPolicy, manifest, annotationXml, flpNavigation);
    const files = await renderFiles("custom", {
        ".gitignore": ".gitignore.hbs",
        "package.json": "package.json.hbs",
        "ui5.yaml": "ui5.yaml.hbs",
        "ui5-mock.yaml": "ui5-mock.yaml.hbs",
        "webapp/index.html": "webapp/index.html.hbs",
        "webapp/test/flpSandbox.html": "webapp/test/flpSandbox.html.hbs",
        "webapp/Component.js": "webapp/Component.js.hbs",
        "webapp/manifest.json": "webapp/manifest.json.hbs",
        "webapp/annotations/annotation.xml": "webapp/annotations/annotation.xml.hbs",
        "webapp/i18n/i18n.properties": "webapp/i18n/i18n.properties.hbs",
        "webapp/ext/view/Main.view.xml": "webapp/ext/view/Main.view.xml.hbs",
        "webapp/ext/controller/Main.controller.js": "webapp/ext/controller/Main.controller.js.hbs",
        "scripts/validate.mjs": "scripts/validate.mjs.hbs",
        "README.md": "README.md.hbs"
    }, values);
    if (directPolicy.enabled) files.set("webapp/ext/fragment/DirectRegion.fragment.xml", await renderTemplate("custom", "webapp/ext/fragment/DirectRegion.fragment.xml.hbs", values));
    return { profile: "custom", files, columns: standardDecision.columns, filters: standardDecision.filters, details: { decision: customDecision, regions, buildingBlocks, directRegionPolicy: directPolicy, flpNavigation } };
}

function createCustomManifest(context, decision, flpNavigation) {
    const { service, namespace } = context;
    return {
        "sap.app": {
            id: namespace,
            type: "application",
            i18n: "i18n/i18n.properties",
            applicationVersion: { version: "1.0.0" },
            title: `Custom page for ${service.entitySet}`,
            description: `Custom Fiori Elements page for ${service.entitySet}`,
            crossNavigation: {
                inbounds: {
                    [flpNavigation.inboundKey]: {
                        semanticObject: flpNavigation.semanticObject,
                        action: flpNavigation.action,
                        title: `Custom page for ${service.entitySet}`,
                        signature: { parameters: {}, additionalParameters: "allowed" }
                    }
                }
            },
            dataSources: {
                mainService: { uri: service.servicePath, type: "OData", settings: { odataVersion: "4.0", annotations: ["localAnnotations"] } },
                localAnnotations: { type: "ODataAnnotation", uri: "annotations/annotation.xml" }
            }
        },
        "sap.ui": { technology: "UI5", deviceTypes: { desktop: true, tablet: true, phone: true } },
        "sap.ui5": {
            flexEnabled: false,
            dependencies: { libs: { "sap.fe.core": {}, "sap.fe.macros": {}, "sap.m": {}, "sap.ui.core": {} } },
            models: {
                i18n: { type: "sap.ui.model.resource.ResourceModel", settings: { bundleName: `${namespace}.i18n.i18n` } },
                "": { dataSource: "mainService", preload: true, settings: { operationMode: "Server", autoExpandSelect: true, earlyRequests: true } }
            },
            routing: {
                config: { routerClass: "sap.f.routing.Router" },
                routes: [{ pattern: ":?query:", name: decision.targetName, target: decision.targetName }],
                targets: {
                    [decision.targetName]: {
                        type: "Component",
                        id: decision.targetName,
                        name: decision.targetComponent,
                        options: { settings: { contextPath: `/${service.entitySet}`, viewName: decision.viewName } }
                    }
                }
            }
        }
    };
}

function createValues(context, standardDecision, customDecision, regions, buildingBlocks, directPolicy, manifest, annotationXml, flpNavigation) {
    const service = context.service;
    const directRegionMarkup = directPolicy.enabled ? `<core:Fragment fragmentName="${context.namespace}.ext.fragment.DirectRegion" type="XML" />` : "";
    return {
        projectName: context.projectName,
        namespace: context.namespace,
        appTitle: `Custom ${standardDecision.humanizedEntity}`,
        appDescription: `Custom Fiori Elements page for ${service.entitySet}`,
        serviceRoot: service.serviceRoot,
        servicePath: service.servicePath,
        origin: service.origin,
        backendPath: service.servicePath.replace(/\/$/, "") || "/",
        odataVersion: service.odataVersion,
        entitySet: service.entitySet,
        entityType: service.entityType,
        keys: service.keys.join(", "),
        properties: service.properties.map((property) => property.name).join(", "),
        manifestJson: JSON.stringify(manifest, null, 2),
        flpInboundKey: flpNavigation.inboundKey,
        flpSandboxConfigJson: JSON.stringify(createFlpSandboxConfig({
            appTitle: `Custom ${standardDecision.humanizedEntity}`,
            appDescription: `Custom Fiori Elements page for ${service.entitySet}`,
            namespace: context.namespace,
            navigation: flpNavigation
        }), null, 2),
        annotationXml,
        i18nProperties: [`appTitle=Custom ${standardDecision.humanizedEntity}`, `appDescription=Custom Fiori Elements page for ${service.entitySet}`, ...standardDecision.columns.map((property) => `${property.name}=${property.label}`)].join("\n"),
        targetName: customDecision.targetName,
        viewName: customDecision.viewName,
        regionsJson: JSON.stringify(regions, null, 2),
        buildingBlocksJson: JSON.stringify(buildingBlocks, null, 2),
        directRegionMarkup
    };
}
