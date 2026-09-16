import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { runCapGeneration } from "../../generation/backend/cap/generator.mjs";

export function parseBackendArgs(argv) {
    if (argv.length !== 2 || argv[0] !== "--handoff" || !argv[1]) throw new Error("Usage: npm run generate:backend -- --handoff <protocol-handoff.json>");
    return { handoffPath: path.resolve(argv[1]) };
}

export async function main(argv = process.argv.slice(2)) {
    const { handoffPath } = parseBackendArgs(argv);
    const handoff = JSON.parse(await readFile(handoffPath, "utf8"));
    const result = await runCapGeneration(handoff);
    console.log(JSON.stringify({ status: result.status, handoffId: result.handoffId, projectPath: result.projectPath, checks: result.checks, prerequisites: result.prerequisites }, null, 2));
    process.exitCode = result.status === "VALIDATED" ? 0 : result.status === "BLOCKED" ? 2 : 1;
    return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    main().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
