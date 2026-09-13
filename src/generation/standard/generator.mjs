import { renderFiles, renderTemplate } from "../../generation/common/template-renderer.mjs";
import { createStandardDecision } from "./decision.mjs";
import { createAnnotationXml } from "./annotation-plan.mjs";
import { createStandardManifest } from "./manifest-plan.mjs";
import { getExtensionPolicy } from "./extension-policy.mjs";
import { createFlpNavigation, createFlpSandboxConfig } from "../common/flp-navigation.mjs";

export async function generateStandardProject(context) {
    const decision = createStandardDecision(context);
    const extensionPolicy = getExtensionPolicy(context.request);
    const flpNavigation = createFlpNavigation(context);
    const manifest = createStandardManifest(context, decision, flpNavigation);
    const annotationXml = createAnnotationXml({ service: context.service, ...decision });
    const values = createValues(context, decision, manifest, annotationXml, extensionPolicy, flpNavigation);
    const files = await renderFiles("standard", {
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
        "scripts/validate.mjs": "scripts/validate.mjs.hbs",
        "README.md": "README.md.hbs"
    }, values);
    if (extensionPolicy.allowed) files.set("webapp/ext/ListReportExtension.js", await renderTemplate("standard", "webapp/ext/ListReportExtension.js.hbs", values));
    return { profile: "standard", files, columns: decision.columns, filters: decision.filters, details: { decision, extensionPolicy, flpNavigation } };
}

function createValues(context, decision, manifest, annotationXml, extensionPolicy, flpNavigation) {
    const { service } = context;
    return {
        projectName: context.projectName,
        namespace: context.namespace,
        appTitle: decision.humanizedEntity,
        appDescription: `Fiori application for ${service.entitySet}`,
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
            appTitle: decision.humanizedEntity,
            appDescription: `Fiori application for ${service.entitySet}`,
            namespace: context.namespace,
            navigation: flpNavigation
        }), null, 2),
        annotationXml,
        i18nProperties: [`appTitle=${decision.humanizedEntity}`, `appDescription=Fiori application for ${service.entitySet}`, ...decision.columns.map((property) => `${property.name}=${property.label}`)].join("\n"),
        exportRequested: decision.exportEnabled ? "true" : "false",
        extensionRequested: extensionPolicy.requested ? "true" : "false"
    };
}
