import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

const IGNORED = new Set(["node_modules", "dist", "deployment", ".git"]);

async function collect(root, current = root) {
    const entries = await readdir(current, { withFileTypes: true });
    const files = [];
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
        if (IGNORED.has(entry.name)) continue;
        const absolute = path.join(current, entry.name);
        if (entry.isSymbolicLink()) throw new Error(`Symbolic links are not allowed: ${absolute}`);
        if (entry.isDirectory()) files.push(...await collect(root, absolute));
        else if (entry.isFile()) files.push(absolute);
    }
    return files;
}

export async function hashPath(target) {
    const info = await stat(target);
    const hash = createHash("sha256");
    if (info.isFile()) return hash.update(await readFile(target)).digest("hex");
    for (const file of await collect(target)) {
        hash.update(path.relative(target, file).replaceAll("\\", "/"));
        hash.update("\0");
        hash.update(await readFile(file));
        hash.update("\0");
    }
    return hash.digest("hex");
}

export async function validateComponentResults(components, workspaceRoot) {
    const normalized = [];
    for (const component of components) {
        const outputPath = path.resolve(workspaceRoot, component.outputPath);
        const relative = path.relative(workspaceRoot, outputPath);
        if (relative.startsWith("..") || path.isAbsolute(relative)) throw new Error(`Component path escapes workspace: ${component.outputPath}`);
        const checksum = await hashPath(outputPath);
        if (checksum.toLowerCase() !== component.checksum.toLowerCase()) throw new Error(`Component checksum mismatch: ${component.resultId}`);
        let capabilities = { ...(component.capabilities ?? {}) };
        if (component.kind === "BACKEND") {
            let packageJson;
            try { packageJson = JSON.parse(await readFile(path.join(outputPath, "package.json"), "utf8")); }
            catch { throw new Error(`Backend component has no readable package.json: ${component.resultId}`); }
            if (!packageJson.dependencies?.["@sap/cds"]) throw new Error(`Backend component is not a CAP Node.js project: ${component.resultId}`);
            const db = packageJson.cds?.requires?.db;
            const productionKind = db?.["[production]"]?.kind ?? db?.kind;
            const persistence = productionKind === "hana" ? "HANA" : productionKind === "sqlite" ? "SQLITE" : null;
            if (!persistence) throw new Error(`Backend persistence profile is unsupported: ${component.resultId}`);
            if (capabilities.persistence && capabilities.persistence !== persistence) throw new Error(`Backend persistence capability conflicts with package profile: ${component.resultId}`);
            capabilities = { ...capabilities, runtime: "NODEJS", persistence };
        }
        if (component.kind === "FRONTEND" && capabilities.proxies) {
            if (!Array.isArray(capabilities.proxies) || capabilities.proxies.some(({ prefix, base } = {}) => !/^\/[A-Za-z0-9/_-]*\/$/.test(prefix ?? "") || !/^https:\/\//.test(base ?? ""))) {
                throw new Error(`Frontend proxy capability is invalid: ${component.resultId}`);
            }
        }
        normalized.push({ ...component, capabilities, outputPath, checksum });
    }
    return normalized;
}
