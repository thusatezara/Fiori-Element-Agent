import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const manifestUrl = new URL("../webapp/manifest.json", import.meta.url);
const homeViewUrl = new URL("../webapp/view/Home.view.xml", import.meta.url);
const manifest = JSON.parse(await readFile(manifestUrl, "utf8"));
const homeView = await readFile(homeViewUrl, "utf8");
const bookDetailView = await readFile(new URL("../webapp/view/BookDetail.view.xml", import.meta.url), "utf8");
const productDetailView = await readFile(new URL("../webapp/view/ProductDetail.view.xml", import.meta.url), "utf8");
const homeController = await readFile(new URL("../webapp/controller/Home.controller.js", import.meta.url), "utf8");

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
