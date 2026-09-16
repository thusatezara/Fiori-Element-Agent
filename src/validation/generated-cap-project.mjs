import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { createServiceSnapshots, assertSnapshotConsistency } from "../generation/backend/cap/service-snapshot.mjs";

const require = createRequire(import.meta.url);

function check(id, status, summary, startedAt) {
    return { id, required: true, status, summary, durationMs: Date.now() - startedAt };
}

async function runNode(args, options) {
    return new Promise((resolve) => {
        const child = spawn(process.execPath, args, { ...options, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
        let output = "";
        child.stdout.on("data", (chunk) => { output += chunk; });
        child.stderr.on("data", (chunk) => { output += chunk; });
        child.on("error", (error) => resolve({ passed: false, output: error.message }));
        child.on("exit", (code) => resolve({ passed: code === 0, output: output.slice(-4000) }));
    });
}

async function smokeStart(projectDirectory, servicePath) {
    const cdsBin = path.join(path.dirname(require.resolve("@sap/cds/package.json")), "bin", "serve.js");
    const port = 41000 + Math.floor(Math.random() * 1000);
    const child = spawn(process.execPath, [cdsBin], {
        cwd: projectDirectory,
        env: { ...process.env, PORT: String(port), NODE_ENV: "development", CDS_CONFIG: "" },
        windowsHide: true,
        stdio: ["ignore", "pipe", "pipe"]
    });
    let output = "";
    child.stdout.on("data", (chunk) => { output += chunk; });
    child.stderr.on("data", (chunk) => { output += chunk; });
    try {
        for (let attempt = 0; attempt < 50; attempt += 1) {
            if (child.exitCode !== null) throw new Error(`CAP server exited early: ${output.slice(-1500)}`);
            try {
                const response = await fetch(`http://127.0.0.1:${port}${servicePath.replace(/\/$/, "")}/$metadata`);
                if (response.ok && (await response.text()).includes("edmx:Edmx")) return;
            } catch { /* server is still starting */ }
            await new Promise((resolve) => setTimeout(resolve, 100));
        }
        throw new Error(`CAP metadata smoke test timed out: ${output.slice(-1500)}`);
    } finally {
        child.kill("SIGTERM");
        if (process.platform === "win32" && child.pid) spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], { windowsHide: true, stdio: "ignore" });
    }
}

export async function validateGeneratedCapProject(projectDirectory, plans) {
    const checks = [];
    const metadataByService = new Map();
    let csn;
    let startedAt = Date.now();
    try {
        const cds = (await import("@sap/cds")).default;
        csn = await cds.load(["db", "srv"], { root: projectDirectory });
        for (const service of plans.service.services) metadataByService.set(service.name, cds.compile.to.edmx(csn, { service: service.name }));
        checks.push(check("CDS_COMPILE", "PASS", "CDS model and OData metadata compiled.", startedAt));
    } catch (error) {
        checks.push(check("CDS_COMPILE", "FAIL", `CDS compile failed: ${error.message}`, startedAt));
        return { passed: false, checks, serviceSnapshots: [], metadataByService };
    }

    startedAt = Date.now();
    const contractErrors = [];
    for (const service of plans.service.services) for (const entity of service.entities) if (!csn.definitions[`${service.name}.${entity.name}`]) contractErrors.push(`${service.name}.${entity.name} is missing.`);
    checks.push(check("CONTRACT_TEST", contractErrors.length ? "FAIL" : "PASS", contractErrors.join(" ") || "Compiled public service contract matches the plan.", startedAt));

    startedAt = Date.now();
    const handlerPath = path.join(projectDirectory, "srv", "service.js");
    let handlerPassed = true;
    if (plans.behavior.behaviors.length) {
        try { await access(handlerPath); handlerPassed = (await runNode(["--check", handlerPath], { cwd: projectDirectory })).passed; } catch { handlerPassed = false; }
    } else {
        try { await access(handlerPath); handlerPassed = false; } catch { handlerPassed = true; }
    }
    checks.push(check("HANDLER_TEST", handlerPassed ? "PASS" : "FAIL", handlerPassed ? "Handler presence and syntax match the behavior plan." : "Generated handler validation failed.", startedAt));

    startedAt = Date.now();
    const generatedTests = await runNode(["--test", path.join(projectDirectory, "test", "service.test.js")], { cwd: projectDirectory });
    if (!generatedTests.passed) {
        const contract = checks.find(({ id }) => id === "CONTRACT_TEST");
        contract.status = "FAIL";
        contract.summary = `Generated contract test failed: ${generatedTests.output}`;
    }

    startedAt = Date.now();
    try {
        await smokeStart(projectDirectory, plans.service.services[0].path);
        checks.push(check("LOCAL_START", "PASS", "Local CAP server returned OData metadata.", startedAt));
    } catch (error) {
        checks.push(check("LOCAL_START", "FAIL", error.message, startedAt));
    }

    startedAt = Date.now();
    const serviceSnapshots = createServiceSnapshots(csn, plans.service, metadataByService);
    const consistency = assertSnapshotConsistency(serviceSnapshots, plans.service);
    checks.push(check("SNAPSHOT_CONSISTENCY", consistency.passed ? "PASS" : "FAIL", consistency.errors.join(" ") || "Snapshots match compiled public models.", startedAt));
    return { passed: checks.every(({ status }) => status === "PASS"), checks, serviceSnapshots, metadataByService };
}
