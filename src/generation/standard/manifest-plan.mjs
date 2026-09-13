export function createStandardManifest(context, decision, flpNavigation) {
    const { service, namespace } = context;
    const entitySegment = service.entitySet.replace(/[^A-Za-z0-9_]/g, "_");
    const listRoute = `${entitySegment}List`;
    const objectRoute = `${entitySegment}ObjectPage`;
    const base = {
        "sap.app": {
            id: namespace,
            type: "application",
            i18n: "i18n/i18n.properties",
            applicationVersion: { version: "1.0.0" },
            title: decision.humanizedEntity,
            description: `Fiori application for ${service.entitySet}`,
            crossNavigation: {
                inbounds: {
                    [flpNavigation.inboundKey]: {
                        semanticObject: flpNavigation.semanticObject,
                        action: flpNavigation.action,
                        title: decision.humanizedEntity,
                        signature: { parameters: {}, additionalParameters: "allowed" }
                    }
                }
            },
            dataSources: {
                mainService: { uri: service.servicePath, type: "OData", settings: { annotations: ["localAnnotations"], odataVersion: service.odataVersion } },
                localAnnotations: { type: "ODataAnnotation", uri: "annotations/annotation.xml" }
            }
        },
        "sap.ui": { technology: "UI5", deviceTypes: { desktop: true, tablet: true, phone: true } },
        "sap.ui5": {
            flexEnabled: false,
            dependencies: service.odataVersion === "4.0"
                ? { minUI5Version: "1.141.0", libs: { "sap.fe.templates": {}, "sap.ui.core": {}, "sap.m": {} } }
                : { libs: { "sap.suite.ui.generic.template": {}, "sap.ui.comp": {}, "sap.m": {} } },
            models: {
                i18n: { type: "sap.ui.model.resource.ResourceModel", settings: { bundleName: `${namespace}.i18n.i18n` } },
                "": service.odataVersion === "4.0"
                    ? { dataSource: "mainService", preload: true, settings: { synchronizationMode: "None", operationMode: "Server", autoExpandSelect: true, earlyRequests: true } }
                    : { dataSource: "mainService", preload: true, settings: { defaultBindingMode: "OneWay", useBatch: true } }
            },
            routing: service.odataVersion === "4.0"
                ? {
                    config: { routerClass: "sap.f.routing.Router", flexibleColumnLayout: { defaultTwoColumnLayoutType: "TwoColumnsMidExpanded", defaultThreeColumnLayoutType: "ThreeColumnsMidExpanded" } },
                    routes: [{ pattern: ":?query:", name: listRoute, target: listRoute }, { pattern: `${service.entitySet}({key}):?query:`, name: objectRoute, target: [listRoute, objectRoute] }],
                    targets: {
                        [listRoute]: { type: "Component", id: listRoute, name: "sap.fe.templates.ListReport", options: { settings: { contextPath: `/${service.entitySet}`, variantManagement: "Page", initialLoad: "Disabled", controlConfiguration: { "@com.sap.vocabularies.UI.v1.LineItem": { tableSettings: { type: decision.tableType, selectionMode: "None", enableExport: decision.exportEnabled } } } } } },
                        [objectRoute]: { type: "Component", id: objectRoute, name: "sap.fe.templates.ObjectPage", options: { settings: { editableHeaderContent: false } } }
                    }
                }
                : undefined
        }
    };
    if (service.odataVersion !== "4.0") {
        base["sap.ui.generic.app"] = { _version: "1.1.0", pages: [{ entitySet: service.entitySet, component: { name: "sap.suite.ui.generic.template.ListReport" } }] };
    }
    base["sap.app"].dataSources.localAnnotations = { type: "ODataAnnotation", uri: "annotations/annotation.xml" };
    return removeUndefined(base);
}

function removeUndefined(value) {
    if (Array.isArray(value)) return value.map(removeUndefined);
    if (!value || typeof value !== "object") return value;
    return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined).map(([key, entry]) => [key, removeUndefined(entry)]));
}
