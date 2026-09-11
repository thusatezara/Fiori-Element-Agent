import { readFile } from "node:fs/promises";

const manifest = JSON.parse(await readFile(new URL("../webapp/manifest.json", import.meta.url), "utf8"));
const annotation = await readFile(new URL("../webapp/annotations/annotation.xml", import.meta.url), "utf8");
const service = manifest["sap.app"]?.dataSources?.mainService;
const targets = manifest["sap.ui5"]?.routing?.targets ?? {};
const listTarget = Object.values(targets).find((target) => target.name === "sap.fe.templates.ListReport");
if (!manifest["sap.app"]?.id || !service?.uri || !service?.settings?.odataVersion) throw new Error("Missing application or OData service configuration");
if (!listTarget?.options?.settings?.contextPath) throw new Error("Missing List Report contextPath");
for (const term of ["UI.HeaderInfo", "UI.SelectionFields", "UI.LineItem", "UI.Facets"]) if (!annotation.includes("Term=\"" + term + "\"")) throw new Error("Missing local annotation: " + term);
console.log("Validated generic Fiori Elements application, service binding, routing, and annotations.");
