import { readFile } from "node:fs/promises";

const manifest = JSON.parse(await readFile(new URL("../webapp/manifest.json", import.meta.url), "utf8"));
const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
const annotation = await readFile(new URL("../webapp/annotations/annotation.xml", import.meta.url), "utf8");
const sandbox = await readFile(new URL("../webapp/test/flpSandbox.html", import.meta.url), "utf8");
const startWrapper = await readFile(new URL("./start.mjs", import.meta.url), "utf8");
const ui5Config = await readFile(new URL("../ui5.yaml", import.meta.url), "utf8");
const targets = manifest["sap.ui5"]?.routing?.targets ?? {};
const hasListReport = Object.values(targets).some((target) => target.name === "sap.fe.templates.ListReport") || Boolean(manifest["sap.ui.generic.app"]);
if (!manifest["sap.app"]?.id || !manifest["sap.app"]?.dataSources?.mainService?.uri) throw new Error("Missing application or OData service configuration");
if (!hasListReport) throw new Error("Missing List Report target");
const inbounds = manifest["sap.app"]?.crossNavigation?.inbounds ?? {};
const inboundKeys = Object.keys(inbounds);
if (inboundKeys.length !== 1) throw new Error("Missing or ambiguous FLP inbound navigation");
const inboundKey = inboundKeys[0];
const inbound = inbounds[inboundKey];
if (`${inbound.semanticObject}-${inbound.action}` !== inboundKey) throw new Error("Manifest FLP inbound semantic object and action do not match its key");
const directStartMatches = packageJson.scripts?.start?.includes("fiori run --open") && packageJson.scripts.start.includes(`#${inboundKey}`);
const bridgeStartMatches = packageJson.scripts?.start === "node scripts/start.mjs" && startWrapper.includes(`#${inboundKey}`);
if (!directStartMatches && !bridgeStartMatches) throw new Error("FLP start script does not match the manifest inbound");
if (bridgeStartMatches && (!ui5Config.includes("url: http://localhost:4004") || !startWrapper.includes('replaceAll("OData-Version: 4.0;", "OData-Version: 4.0")'))) {
    throw new Error("Northwind OData-Version bridge is not configured consistently");
}
if (!sandbox.includes(`\"${inboundKey}\"`) || !sandbox.includes(`SAPUI5.Component=${manifest["sap.app"].id}`) || !sandbox.includes("sap/ushell/bootstrap/sandbox.js")) throw new Error("Invalid FLP Sandbox configuration");
for (const term of ["UI.HeaderInfo", "UI.SelectionFields", "UI.LineItem", "UI.Facets"]) if (!annotation.includes(`Term=\"${term}\"`)) throw new Error(`Missing local annotation: ${term}`);
console.log("Validated Standard Fiori Elements application, service binding, routing, annotations, and FLP Sandbox.");
