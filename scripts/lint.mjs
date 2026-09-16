import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import path from "node:path";

function collect(directory) {
    return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        const target = path.join(directory, entry.name);
        if (entry.isDirectory()) return collect(target);
        return entry.isFile() && /\.(mjs|js)$/.test(entry.name) ? [target] : [];
    });
}

for (const root of ["src", "tests", "scripts"]) {
    for (const file of collect(root)) execFileSync(process.execPath, ["--check", file], { stdio: "pipe" });
}
console.log("JavaScript syntax validation passed.");
