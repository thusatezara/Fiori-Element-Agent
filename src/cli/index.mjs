import { runGeneration } from "../orchestration/generate.mjs";
export { main as generateBackend } from "./commands/generate-backend.mjs";

export function parseArgs(argv) {
    const options = {};
    for (let index = 0; index < argv.length; index += 1) {
        const argument = argv[index];
        if (argument === "--help" || argument === "-h") {
            options.help = true;
            continue;
        }
        if (!argument.startsWith("--")) throw new Error(`Unknown argument: ${argument}`);
        const key = argument.slice(2);
        const value = argv[index + 1];
        if (!value || value.startsWith("--")) throw new Error(`Missing value for --${key}`);
        options[key.replaceAll("-", "_")] = value;
        index += 1;
    }
    return options;
}

export function printHelp() {
    console.log(`Fiori Application Agent

Usage:
  npm run generate -- --request "Create a Fiori list and detail application" --odata-url <url>

Options:
  --request <text>          Natural-language application request
  --odata-url <url>         OData entity-set URL or service root
  --metadata-file <path>    Local metadata file for offline generation
  --entity-set <name>       EntitySet when the URL points to a service root
  --output <path>            Empty output directory (default: generated/<project-name>)
  --project-name <name>     Generated project/package name
  --flp-intent <object-action>
                            FLP Sandbox intent (default: <entity-set>-display)
  --type <auto|standard|custom|freestyle>
                            Optional type override; auto uses protocol 001
  --help                    Show this help
`);
}

export async function main(argv = process.argv.slice(2)) {
    const options = parseArgs(argv);
    if (options.help) {
        printHelp();
        return null;
    }
    const result = await runGeneration(options);
    console.log(JSON.stringify(result, null, 2));
    return result;
}
