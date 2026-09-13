import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import {
    classifyRequest,
    parseODataMetadata,
    parseServiceInput,
    runGeneration
} from "../src/orchestration/generate.mjs";

const metadata = await readFile(new URL("./fixtures/sample-metadata.xml", import.meta.url), "utf8");

test("001 parses a generic OData service and selects the EntitySet from the URL", () => {
    const input = parseServiceInput("https://service.example.test/odata/Products");
    const service = parseODataMetadata(metadata, input);
    assert.equal(service.odataVersion, "4.0");
    assert.equal(service.entitySet, "Products");
    assert.deepEqual(service.keys, ["ID"]);
    assert.deepEqual(service.navigationProperties, ["category"]);
    assert.deepEqual(service.properties.map(({ name }) => name), ["ID", "name", "description", "price"]);
});

test("001 routes natural-language requests to exactly one generator protocol", () => {
    const service = parseODataMetadata(metadata, parseServiceInput("https://service.example.test/odata/Products"));
    assert.equal(classifyRequest("검색과 상세 조회 화면", service).selectedType, "STANDARD");
    assert.equal(classifyRequest("고유 배치의 custom page", service).selectedType, "CUSTOM");
    assert.equal(classifyRequest("다단계 wizard와 상태 보존", service).selectedType, "FREESTYLE");
});

test("the reusable pipeline generates a generic application without request-specific specs", async () => {
    const directory = await mkdtemp(join(process.cwd(), ".fiori-agent-test-"));
    const output = join(directory, "products-app");
    try {
        const result = await runGeneration({
            request: "Products 목록과 상세를 조회하고 Excel로 다운로드하는 Fiori application",
            odata_url: "https://service.example.test/odata/Products",
            metadata_file: "tests/fixtures/sample-metadata.xml",
            output
        });
        assert.equal(result.protocol.entry, "001");
        assert.equal(result.protocol.selectedGenerator, "002");
        const manifest = await readFile(join(output, "webapp/manifest.json"), "utf8");
        assert.match(manifest, /Products/);
        assert.match(manifest, /"annotations":\s*\[\s*"localAnnotations"/);
        assert.match(manifest, /"minUI5Version":\s*"1\.141\.0"/);
        assert.match(manifest, /"synchronizationMode":\s*"None"/);
        assert.match(manifest, /"initialLoad":\s*"Disabled"/);
        assert.match(manifest, /"enableExport":\s*true/);
        assert.match(manifest, /"crossNavigation":/);
        assert.match(manifest, /"products-display":/);
        const packageJson = await readFile(join(output, "package.json"), "utf8");
        assert.match(packageJson, /fiori run --open \\\"test\/flpSandbox\.html\?sap-ui-xx-viewCache=false#products-display\\\"/);
        const index = await readFile(join(output, "webapp/index.html"), "utf8");
        assert.match(index, /data-sap-ui-compatVersion="edge"/);
        assert.match(index, /html, body, #content, \[data-id="container"\], #container, #container-uiarea \{ height: 100%;/);
        const flpSandbox = await readFile(join(output, "webapp/test/flpSandbox.html"), "utf8");
        assert.match(flpSandbox, /sap-ushell-config/);
        assert.match(flpSandbox, /SAPUI5\.Component=com\.fiori\.agent\.products/);
        assert.match(await readFile(join(output, "fiori-agent-report.json"), "utf8"), /"handoff": "002"/);
    } finally {
        await rm(directory, { recursive: true, force: true });
    }
});

test("the same 001 entry point dispatches Custom and Freestyle without cross-generating projects", async () => {
    const directory = await mkdtemp(join(process.cwd(), ".fiori-agent-test-"));
    try {
        const customOutput = join(directory, "custom-app");
        const custom = await runGeneration({
            request: "Products custom page with direct interaction",
            odata_url: "https://service.example.test/odata/Products",
            metadata_file: "tests/fixtures/sample-metadata.xml",
            output: customOutput
        });
        assert.equal(custom.protocol.selectedGenerator, "003");
        assert.match(await readFile(join(customOutput, "webapp/manifest.json"), "utf8"), /sap\.fe\.core\.fpm/);
        assert.match(await readFile(join(customOutput, "webapp/ext/view/Main.view.xml"), "utf8"), /macros:FilterBar/);

        const freestyleOutput = join(directory, "freestyle-app");
        const freestyle = await runGeneration({
            request: "Products multi-step wizard with state and retry",
            odata_url: "https://service.example.test/odata/Products",
            metadata_file: "tests/fixtures/sample-metadata.xml",
            output: freestyleOutput
        });
        assert.equal(freestyle.protocol.selectedGenerator, "004");
        assert.match(await readFile(join(freestyleOutput, "webapp/manifest.json"), "utf8"), /review/);
        assert.match(await readFile(join(freestyleOutput, "webapp/model/models.js"), "utf8"), /JSONModel/);
        assert.equal(await readFile(join(freestyleOutput, "webapp/view/Review.view.xml"), "utf8") !== "", true);
    } finally {
        await rm(directory, { recursive: true, force: true });
    }
});

test("generated Fiori Elements apps accept an explicit FLP intent for future runs", async () => {
    const directory = await mkdtemp(join(process.cwd(), ".fiori-agent-test-"));
    const output = join(directory, "intent-app");
    try {
        await runGeneration({
            request: "Products 목록을 조회하는 Fiori application",
            odata_url: "https://service.example.test/odata/Products",
            metadata_file: "tests/fixtures/sample-metadata.xml",
            flp_intent: "cominnotekitembod-tile",
            output
        });
        const packageJson = await readFile(join(output, "package.json"), "utf8");
        const manifest = await readFile(join(output, "webapp/manifest.json"), "utf8");
        const sandbox = await readFile(join(output, "webapp/test/flpSandbox.html"), "utf8");
        assert.match(packageJson, /#cominnotekitembod-tile/);
        assert.match(manifest, /"cominnotekitembod-tile":/);
        assert.match(sandbox, /"cominnotekitembod-tile":/);
    } finally {
        await rm(directory, { recursive: true, force: true });
    }
});
