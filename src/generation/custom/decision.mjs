export function createCustomDecision(context) {
    if (context.service.odataVersion !== "4.0") {
        throw new Error("Custom Fiori Elements generation requires an OData V4 service; reclassify as Standard for OData V2.");
    }
    return {
        targetName: "CustomPage",
        targetComponent: "sap.fe.core.fpm",
        viewName: `${context.namespace}.ext.view.Main`,
        reclassification: "If the requested regions can be expressed by standard List Report features, prefer STANDARD (002)."
    };
}
