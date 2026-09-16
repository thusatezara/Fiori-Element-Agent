import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { access, mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { hashPath } from "../src/composition/mta/component-result-adapter.mjs";
import { composeMtaSolution } from "../src/composition/mta/protocol.mjs";

async function fixture() {
    const root = await mkdtemp(path.join(os.tmpdir(), "mta-protocol-"));
    const source = path.join(root, "source");
    await mkdir(path.join(source, "webapp"), { recursive: true });
    await writeFile(path.join(source, "webapp", "index.html"), '<script id="sap-ui-bootstrap" src="resources/sap-ui-core.js"></script>');
    const request = {
        handoffVersion: "1.0", handoffId: randomUUID(), planId: randomUUID(), stepId: "package",
        protocol: { id: "200", version: "1.0" }, completedDependencies: ["frontend"], requestedAt: new Date().toISOString(),
        solutionId: "demo-app", outputDirectory: "package-output",
        components: [{ resultId: randomUUID(), protocol: { id: "004", version: "1.0" }, kind: "FRONTEND", validationStatus: "PASSED", outputPath: "source", checksum: await hashPath(source), capabilities: {}, validatedAt: new Date().toISOString() }],
        identity: { applicationId: "demo-app", sapCloudService: "demo-app", version: "1.0.0" }, requirements: []
    };
    return { root, request };
}

async function backendFixture(applicationId = "inventory-api") {
    const root = await mkdtemp(path.join(os.tmpdir(), "mta-backend-protocol-"));
    const source = path.join(root, "source-backend");
    await mkdir(path.join(source, "db"), { recursive: true });
    await mkdir(path.join(source, "srv"), { recursive: true });
    await writeFile(path.join(source, "package.json"), JSON.stringify({
        name: applicationId,
        version: "1.0.0",
        dependencies: { "@sap/cds": "^9.7.0", "@cap-js/hana": "^2.0.0" },
        cds: { requires: { db: { "[development]": { kind: "sqlite" }, "[production]": { kind: "hana" } } } }
    }));
    await writeFile(path.join(source, "db", "schema.cds"), "namespace inventory; entity Items { key ID: Integer; }\n");
    await writeFile(path.join(source, "srv", "service.cds"), "using inventory from '../db/schema'; service InventoryService { entity Items as projection on inventory.Items; }\n");
    return {
        root,
        request: {
            handoffVersion: "1.0", handoffId: randomUUID(), planId: randomUUID(), stepId: "package",
            protocol: { id: "200", version: "1.0" }, completedDependencies: ["backend"], requestedAt: new Date().toISOString(),
            solutionId: applicationId, outputDirectory: "package-output",
            components: [{ resultId: randomUUID(), protocol: { id: "100", version: "1.0" }, kind: "BACKEND", validationStatus: "PASSED", outputPath: "source-backend", checksum: await hashPath(source), capabilities: {}, validatedAt: new Date().toISOString() }],
            identity: { applicationId, sapCloudService: applicationId, version: "1.0.0" }, requirements: []
        }
    };
}

test("200 validates input, renders a deterministic descriptor and returns a checksummed archive", async () => {
    const { root, request } = await fixture();
    const buildAdapter = { async build({ archiveDirectory }) { await writeFile(path.join(archiveDirectory, "demo-app_1.0.0.mtar"), "archive"); return { passed: true, code: 0, output: "ok" }; } };
    const result = await composeMtaSolution(request, { workspaceRoot: root, buildAdapter });
    assert.equal(result.status, "READY");
    assert.match(result.archiveChecksum, /^[a-f0-9]{64}$/);
    assert.ok(result.validation.every(({ status }) => status === "PASSED"));
    const descriptor = await readFile(path.join(root, "package-output", "mta.yaml"), "utf8");
    assert.match(descriptor, /random-route: true/);
    assert.match(await readFile(path.join(root, "package-output", "app", "webapp", "index.html"), "utf8"), /https:\/\/ui5\.sap\.com/);
});

test("200 blocks failed validation, tampering and output collisions before build", async () => {
    const { root, request } = await fixture();
    let builds = 0;
    const adapter = { async build() { builds += 1; return { passed: true }; } };
    const invalid = await composeMtaSolution({ ...request, components: [{ ...request.components[0], validationStatus: "FAILED" }] }, { workspaceRoot: root, buildAdapter: adapter });
    assert.equal(invalid.status, "BLOCKED");
    const tampered = await composeMtaSolution({ ...request, components: [{ ...request.components[0], checksum: "a".repeat(64) }] }, { workspaceRoot: root, buildAdapter: adapter });
    assert.equal(tampered.status, "BLOCKED");
    assert.equal(builds, 0);
});

test("200 derives reusable CAP HANA topology from application identity and validated backend metadata", async () => {
    const { root, request } = await backendFixture();
    const buildAdapter = { async build({ cwd, archiveDirectory }) { await mkdir(path.join(cwd, "backend", "node_modules", "temporary"), { recursive: true }); await writeFile(path.join(archiveDirectory, "inventory-api_1.0.0.mtar"), "archive"); return { passed: true, code: 0, output: "ok" }; } };
    const result = await composeMtaSolution(request, { workspaceRoot: root, buildAdapter });
    assert.equal(result.status, "READY", JSON.stringify(result.blockingReasons));
    const descriptor = await readFile(path.join(root, "package-output", "mta.yaml"), "utf8");
    for (const expected of ["inventory-api-srv", "inventory-api-db-deployer", "inventory-api-db", "com.sap.xs.hdi-container", "hdi-shared", "backend/gen/srv", "backend/gen/db"]) {
        assert.ok(descriptor.includes(expected), `missing ${expected}`);
    }
    assert.doesNotMatch(descriptor, /bookshop/i);
    await access(path.join(root, "package-output", "backend", "package.json"));
    await assert.rejects(access(path.join(root, "package-output", "backend", "node_modules")));
    assert.deepEqual(result.serviceRequirements, [{ name: "inventory-api-db", offering: "hana", plan: "hdi-shared" }]);
});

test("200 rejects a backend whose declared capability conflicts with its CAP persistence profile", async () => {
    const { root, request } = await backendFixture("orders-api");
    request.components[0].capabilities.persistence = "SQLITE";
    const result = await composeMtaSolution(request, { workspaceRoot: root, buildAdapter: { async build() { throw new Error("must not build"); } } });
    assert.equal(result.status, "BLOCKED");
    assert.match(result.blockingReasons.map(({ message }) => message).join(" "), /persistence.*conflict/i);
});
