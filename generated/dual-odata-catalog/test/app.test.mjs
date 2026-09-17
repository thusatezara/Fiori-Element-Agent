import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const manifestUrl = new URL("../webapp/manifest.json", import.meta.url);
const homeViewUrl = new URL("../webapp/view/Home.view.xml", import.meta.url);
const manifest = JSON.parse(await readFile(manifestUrl, "utf8"));
const xsApp = JSON.parse(await readFile(new URL("../webapp/xs-app.json", import.meta.url), "utf8"));
const homeView = await readFile(homeViewUrl, "utf8");
const bookDetailView = await readFile(new URL("../webapp/view/BookDetail.view.xml", import.meta.url), "utf8");
const productDetailView = await readFile(new URL("../webapp/view/ProductDetail.view.xml", import.meta.url), "utf8");
const homeController = await readFile(new URL("../webapp/controller/Home.controller.js", import.meta.url), "utf8");
const ui5Config = await readFile(new URL("../ui5.yaml", import.meta.url), "utf8");
const deploymentServer = await readFile(new URL("../deployment/app/server.mjs", import.meta.url), "utf8");

test("configures both OData services with their actual protocol versions", () => {
  const sources = manifest["sap.app"].dataSources;
  assert.equal(sources.bookshopService.settings.odataVersion, "4.0");
  assert.equal(sources.northwindService.settings.odataVersion, "2.0");
});

test("does not fetch list data before explicit execution", () => {
  assert.doesNotMatch(homeView, /bookshop>\/Books|northwind>\/Products/);
  assert.match(homeView, /press="\.onExecute"/);
  assert.match(homeController, /_loadBooks/);
  assert.match(homeController, /_loadProducts/);
});

test("provides one detail route for each list", () => {
  const routeNames = manifest["sap.ui5"].routing.routes.map((route) => route.name);
  assert.ok(routeNames.includes("bookDetail"));
  assert.ok(routeNames.includes("productDetail"));
});

test("uses a Standard-aligned DynamicPage title and header shell", () => {
  assert.ok(manifest["sap.ui5"].dependencies.libs["sap.f"]);
  for (const view of [homeView, bookDetailView, productDetailView]) {
    assert.match(view, /<f:DynamicPage/);
    assert.match(view, /<f:DynamicPageTitle/);
    assert.match(view, /<f:DynamicPageHeader/);
    assert.match(view, /<f:content>/);
  }
});

test("points the deployment proxy to the current CAP endpoint and forwards bearer tokens", () => {
  assert.match(ui5Config, /https:\/\/9e20a855trial-dev-bookshop-srv\.cfapps\.us10-001\.hana\.ondemand\.com/);
  assert.match(deploymentServer, /https:\/\/9e20a855trial-dev-bookshop-srv\.cfapps\.us10-001\.hana\.ondemand\.com\/admin\//);
  assert.match(deploymentServer, /req\.headers\.authorization/);
  assert.doesNotMatch(ui5Config, /cc779debtrial/);
  assert.doesNotMatch(deploymentServer, /cc779debtrial/);
});

test("declares an HTML5 Repository runtime and Work Zone business service", () => {
  assert.equal(manifest["sap.cloud"].service, "dual.odata.catalog");
  assert.equal(xsApp.routes.find((route) => route.destination === "bookshop-api").authenticationType, "xsuaa");
  assert.equal(xsApp.routes.find((route) => route.destination === "northwind-api").authenticationType, "none");
  assert.equal(xsApp.routes.find((route) => route.service === "html5-apps-repo-rt").authenticationType, "xsuaa");
});
