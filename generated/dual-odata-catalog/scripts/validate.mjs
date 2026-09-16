import { readFile, access } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const requiredFiles = [
  "webapp/manifest.json",
  "webapp/Component.js",
  "webapp/view/App.view.xml",
  "webapp/view/Home.view.xml",
  "webapp/view/BookDetail.view.xml",
  "webapp/view/ProductDetail.view.xml",
  "webapp/controller/Home.controller.js",
  "webapp/controller/BookDetail.controller.js",
  "webapp/controller/ProductDetail.controller.js",
  "webapp/controller/NotFound.controller.js"
];

await Promise.all(requiredFiles.map((file) => access(resolve(root, file))));

const manifest = JSON.parse(await readFile(resolve(root, "webapp/manifest.json"), "utf8"));
const homeView = await readFile(resolve(root, "webapp/view/Home.view.xml"), "utf8");
const bookDetailView = await readFile(resolve(root, "webapp/view/BookDetail.view.xml"), "utf8");
const productDetailView = await readFile(resolve(root, "webapp/view/ProductDetail.view.xml"), "utf8");
const homeController = await readFile(resolve(root, "webapp/controller/Home.controller.js"), "utf8");

if (manifest["sap.app"].dataSources.bookshopService.settings.odataVersion !== "4.0") {
  throw new Error("Bookshop must use OData V4");
}
if (manifest["sap.app"].dataSources.northwindService.settings.odataVersion !== "2.0") {
  throw new Error("Northwind must use OData V2");
}
if (!manifest["sap.ui5"]?.dependencies?.libs?.["sap.f"]) {
  throw new Error("The application must declare sap.f for the DynamicPage shell");
}
for (const [name, view] of [["Home", homeView], ["BookDetail", bookDetailView], ["ProductDetail", productDetailView]]) {
  for (const control of ["<f:DynamicPage", "<f:DynamicPageTitle", "<f:DynamicPageHeader", "<f:content>"]) {
    if (!view.includes(control)) throw new Error(`${name} is missing page shell control: ${control}`);
  }
}
if (homeView.includes("bookshop>/Books") || homeView.includes("northwind>/Products")) {
  throw new Error("Remote OData collections must not be bound during initial rendering");
}
for (const routeName of ["bookDetail", "productDetail"]) {
  if (!manifest["sap.ui5"].routing.routes.some((route) => route.name === routeName)) {
    throw new Error(`Missing route: ${routeName}`);
  }
}
for (const handler of ["onBookPress", "onProductPress", "onExecute"]) {
  if (!homeController.includes(handler)) {
    throw new Error(`Missing interaction handler: ${handler}`);
  }
}
for (const loader of ["_loadBooks", "_loadProducts"]) {
  if (!homeController.includes(loader)) {
    throw new Error(`Missing deferred loader: ${loader}`);
  }
}

console.log("Static validation passed: DynamicPage shell, dual services, deferred loading, and detail navigation are configured.");
