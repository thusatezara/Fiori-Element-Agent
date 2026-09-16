import { randomUUID } from "node:crypto";
import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { preflightComposition } from "./input-validator.mjs";
import { composeTopology } from "./topology-composer.mjs";
import { detectCollisions } from "./collision-detector.mjs";
import { fingerprintDescriptor, renderDescriptor } from "./descriptor-renderer.mjs";
import { createMbtBuildAdapter } from "./build-adapter.mjs";
import { hashPath } from "./component-result-adapter.mjs";
import { compositionBlocked } from "./composition-report.mjs";
import { validateMtaPackage } from "../../validation/mta-package.mjs";

function serverSource(proxies = []) {
return `import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "webapp");
const contentTypes = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8", ".xml": "application/xml; charset=utf-8", ".css": "text/css; charset=utf-8", ".properties": "text/plain; charset=utf-8", ".png": "image/png", ".svg": "image/svg+xml" };
const proxies = ${JSON.stringify(proxies)};

async function proxy(req, res, match) {
  const target = new URL(req.url.slice(match.prefix.length), match.base);
  const response = await fetch(target, { method: req.method, headers: { accept: req.headers.accept || "application/json" } });
  res.statusCode = response.status;
  for (const [name, value] of response.headers) if (!["connection", "content-length", "content-encoding", "transfer-encoding"].includes(name.toLowerCase())) res.setHeader(name, value);
  res.end(Buffer.from(await response.arrayBuffer()));
}

async function serve(req, res) {
  try {
    const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    const match = proxies.find(({ prefix }) => pathname.startsWith(prefix));
    if (match) return await proxy(req, res, match);
    const requested = pathname === "/" ? "index.html" : pathname.replace(/^\\/+/, "");
    let file = path.resolve(root, requested);
    if (!file.startsWith(root + path.sep)) throw new Error("Invalid path");
    try { if (!(await stat(file)).isFile()) file = path.join(root, "index.html"); }
    catch { file = path.join(root, "index.html"); }
    res.setHeader("content-type", contentTypes[path.extname(file)] || "application/octet-stream");
    res.end(await readFile(file));
  } catch (error) {
    res.statusCode = 502;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ error: "Request failed", message: error.message }));
  }
}

createServer(serve).listen(Number(process.env.PORT || 3000));
`;
}

async function stageFrontend(component, outputDirectory) {
    const appDirectory = path.join(outputDirectory, "app");
    await mkdir(appDirectory, { recursive: true });
    await cp(path.join(component.outputPath, "webapp"), path.join(appDirectory, "webapp"), { recursive: true });
    const indexPath = path.join(appDirectory, "webapp", "index.html");
    const index = await readFile(indexPath, "utf8");
    await writeFile(indexPath, index.replace(/src=["']resources\/sap-ui-core\.js["']/, 'src="https://ui5.sap.com/1.120.0/resources/sap-ui-core.js"'), "utf8");
    await writeFile(path.join(appDirectory, "package.json"), `${JSON.stringify({ name: "dual-odata-catalog-runtime", version: "1.0.0", private: true, type: "module", scripts: { start: "node server.mjs" }, engines: { node: ">=20" } }, null, 2)}\n`, "utf8");
    await writeFile(path.join(appDirectory, "server.mjs"), serverSource(component.capabilities?.proxies), "utf8");
}

async function stageBackends(components, outputDirectory) {
    const backends = components.filter(({ kind }) => kind === "BACKEND");
    for (const [index, component] of backends.entries()) {
        const deploymentPath = backends.length === 1 ? "backend" : `backend-${index + 1}`;
        await cp(component.outputPath, path.join(outputDirectory, deploymentPath), { recursive: true });
    }
}

async function cleanupBackendBuildDependencies(components, outputDirectory) {
    const backends = components.filter(({ kind }) => kind === "BACKEND");
    for (const [index] of backends.entries()) {
        const deploymentPath = backends.length === 1 ? "backend" : `backend-${index + 1}`;
        const backendRoot = path.join(outputDirectory, deploymentPath);
        for (const dependencyPath of ["node_modules", "gen/db/node_modules", "gen/srv/node_modules"]) {
            await rm(path.join(backendRoot, dependencyPath), { recursive: true, force: true });
        }
    }
}

export async function composeMtaSolution(request, { workspaceRoot = process.cwd(), buildAdapter = createMbtBuildAdapter() } = {}) {
    const preflight = await preflightComposition(request, workspaceRoot);
    if (!preflight.passed) return compositionBlocked(preflight.errors, request);
    const topology = composeTopology(request, preflight.components);
    const collisions = detectCollisions(topology);
    if (collisions.length) return compositionBlocked(collisions, request);
    const descriptor = renderDescriptor(topology);
    const descriptorFingerprint = fingerprintDescriptor(descriptor);
    try {
        await mkdir(preflight.outputDirectory, { recursive: false });
        const frontend = preflight.components.find(({ kind }) => kind === "FRONTEND");
        if (frontend) await stageFrontend(frontend, preflight.outputDirectory);
        await stageBackends(preflight.components, preflight.outputDirectory);
        const descriptorPath = path.join(preflight.outputDirectory, "mta.yaml");
        await writeFile(descriptorPath, descriptor, "utf8");
        const archiveDirectory = path.join(preflight.outputDirectory, "mta_archives");
        await mkdir(archiveDirectory, { recursive: true });
        const build = await buildAdapter.build({ cwd: preflight.outputDirectory, archiveDirectory });
        if (!build.passed) throw new Error(`MTA build failed: ${build.output}`);
        const archiveName = (await readdir(archiveDirectory)).find((name) => name.endsWith(".mtar"));
        if (!archiveName) throw new Error("MTA build did not produce an .mtar archive.");
        const archivePath = path.join(archiveDirectory, archiveName);
        const validation = await validateMtaPackage({ descriptorPath, archivePath, topology });
        if (validation.some(({ status }) => status !== "PASSED")) throw new Error("MTA package validation failed.");
        await cleanupBackendBuildDependencies(preflight.components, preflight.outputDirectory);
        const result = {
            resultVersion: "1.0",
            protocol: { id: "200", version: "1.0" },
            status: "READY",
            artifactId: randomUUID(),
            archivePath,
            archiveChecksum: await hashPath(archivePath),
            descriptorFingerprint,
            sourceResultIds: preflight.components.map(({ resultId }) => resultId),
            serviceRequirements: topology.serviceRequirements,
            applicationId: request.identity.applicationId,
            sapCloudService: request.identity.sapCloudService ?? request.identity.applicationId,
            validation,
            blockingReasons: []
        };
        await writeFile(path.join(preflight.outputDirectory, "composition-result.json"), `${JSON.stringify(result, null, 2)}\n`, "utf8");
        return result;
    } catch (error) {
        if (path.relative(workspaceRoot, preflight.outputDirectory) && !path.relative(workspaceRoot, preflight.outputDirectory).startsWith("..")) {
            await rm(preflight.outputDirectory, { recursive: true, force: true });
        }
        return compositionBlocked([error.message], request);
    }
}

export const mtaProtocol = Object.freeze({
    id: "200",
    version: "1.0",
    scope: "PACKAGE",
    status: "IMPLEMENTED",
    riskLevel: "LOCAL_WRITE",
    requires: Object.freeze(["VALIDATED_SOLUTION_INPUT"]),
    produces: Object.freeze(["MTA_DESCRIPTOR", "DEPLOYMENT_ARTIFACT"]),
    specPath: "specs/200-compose-mta-solution/spec.md",
    validationCriteria: Object.freeze(["MTA module and resource references are valid", "Package build validation passes"]),
    executor: composeMtaSolution
});
