import { access, readFile } from "node:fs/promises";
import { containsCredential } from "../orchestration/approval-gate.mjs";

export async function validateMtaPackage({ descriptorPath, archivePath, topology }) {
    const checks = [];
    const descriptor = await readFile(descriptorPath, "utf8");
    checks.push({ name: "descriptor", status: descriptor.includes("_schema-version") && descriptor.includes("modules:") ? "PASSED" : "FAILED" });
    checks.push({ name: "references", status: topology.modules.length > 0 ? "PASSED" : "FAILED" });
    checks.push({ name: "secret-scan", status: containsCredential({ descriptor, topology }) ? "FAILED" : "PASSED" });
    try { await access(archivePath); checks.push({ name: "archive", status: "PASSED" }); }
    catch { checks.push({ name: "archive", status: "FAILED" }); }
    return checks;
}

