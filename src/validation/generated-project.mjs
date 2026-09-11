export function validateGeneratedProject(profile, files, context) {
    const required = ["package.json", "ui5.yaml", "webapp/index.html", "webapp/manifest.json", "webapp/Component.js", "fiori-agent-report.json"];
    if (profile === "standard" || profile === "custom") {
        required.push("webapp/annotations/annotation.xml", "webapp/i18n/i18n.properties", "webapp/test/flpSandbox.html");
    }
    if (profile === "custom") {
        required.push("webapp/ext/view/Main.view.xml", "webapp/ext/controller/Main.controller.js");
    }
    if (profile === "freestyle") {
        required.push("webapp/view/View.view.xml", "webapp/controller/View.controller.js", "webapp/model/models.js", "webapp/i18n/i18n.properties");
    }
    const missing = required.filter((path) => !files.has(path));
    if (missing.length) {
        throw new Error(`Generated project is missing required files: ${missing.join(", ")}`);
    }
    const manifest = JSON.parse(files.get("webapp/manifest.json"));
    const packageJson = JSON.parse(files.get("package.json"));
    if (!manifest["sap.app"]?.id || !manifest["sap.app"]?.dataSources?.mainService?.uri) {
        throw new Error("Generated manifest is missing application or OData service configuration.");
    }
    if (profile === "standard" && !JSON.stringify(manifest).includes("ListReport")) {
        throw new Error("Standard application does not contain a List Report target.");
    }
    if (profile === "standard" || profile === "custom") {
        const inbounds = manifest["sap.app"]?.crossNavigation?.inbounds;
        const sandbox = files.get("webapp/test/flpSandbox.html");
        if (!inbounds || Object.keys(inbounds).length !== 1) {
            throw new Error("Fiori Elements application must contain exactly one FLP inbound navigation entry.");
        }
        const inboundKey = Object.keys(inbounds)[0];
        const inbound = inbounds[inboundKey];
        const startScript = packageJson.scripts?.start ?? "";
        const applicationId = manifest["sap.app"].id;
        if (`${inbound.semanticObject}-${inbound.action}` !== inboundKey) {
            throw new Error("Manifest FLP inbound semantic object and action do not match its key.");
        }
        if (!startScript.includes("fiori run --open") || !startScript.includes(`#${inboundKey}`)) {
            throw new Error("Fiori Elements start script does not point to the manifest FLP inbound intent.");
        }
        if (!sandbox.includes("sap-ushell-config") || !sandbox.includes(`\"${inboundKey}\"`) || !sandbox.includes(`SAPUI5.Component=${applicationId}`) || !sandbox.includes("sap/ushell/bootstrap/sandbox.js")) {
            throw new Error("Fiori Elements application does not contain a valid FLP Sandbox bootstrap.");
        }
    }
    if (profile === "custom" && !JSON.stringify(manifest).includes("sap.fe.core.fpm")) {
        throw new Error("Custom application does not contain a Custom Page target.");
    }
    if (profile === "freestyle" && !files.get("webapp/view/View.view.xml").includes("ColumnListItem")) {
        throw new Error("Freestyle application does not contain a responsive table.");
    }
    return {
        staticFiles: "PASS",
        profile,
        requiredFiles: required,
        nextCommand: "npm install && npm run lint && npm run build",
        status: "PASS"
    };
}
