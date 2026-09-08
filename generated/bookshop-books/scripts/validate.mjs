import { readFile } from "node:fs/promises";
const root = new URL("..", import.meta.url);
const manifestPath = new URL("webapp/manifest.json", root);
const annotationPath = new URL("webapp/annotations/annotation.xml", root);

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const annotation = await readFile(annotationPath, "utf8");

const service = manifest["sap.app"]?.dataSources?.mainService;
const listTarget = manifest["sap.ui5"]?.routing?.targets?.BooksList;

if (manifest["sap.app"]?.id !== "bookshop.books") {
    throw new Error("sap.app.id must be bookshop.books");
}

if (service?.settings?.odataVersion !== "4.0" || service?.uri !== "/admin/") {
    throw new Error("mainService must be the OData V4 /admin/ service");
}

if (listTarget?.name !== "sap.fe.templates.ListReport" || listTarget?.options?.settings?.contextPath !== "/Books") {
    throw new Error("BooksList must be a ListReport for /Books");
}

for (const term of ["UI.HeaderInfo", "UI.SelectionFields", "UI.LineItem", "UI.Facets"]) {
    if (!annotation.includes(`Term="${term}"`)) {
        throw new Error(`Missing local annotation: ${term}`);
    }
}

if (!annotation.includes('Target="AdminService.Books"')) {
    throw new Error("Local annotations must target AdminService.Books");
}

console.log("Validated manifest, OData V4 service, List Report target, and Books annotations.");
