import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const TEMPLATE_ROOT = resolve(fileURLToPath(new URL("../../../templates", import.meta.url)));

export async function renderTemplate(profile, templatePath, values) {
    const absolutePath = resolve(TEMPLATE_ROOT, profile, templatePath);
    const source = await readFile(absolutePath, "utf8");
    return renderString(source, values, absolutePath);
}

export function renderString(source, values, templateName = "template") {
    const rendered = String(source).replace(/{{\s*([A-Za-z0-9_.-]+)\s*}}/g, (match, key) => {
        if (!(key in values)) {
            throw new Error(`Missing template value '${key}' in ${templateName}.`);
        }
        return String(values[key]);
    });
    const unresolved = rendered.match(/{{\s*[A-Za-z0-9_.-]+\s*}}/);
    if (unresolved) {
        throw new Error(`Unresolved template token '${unresolved[0]}' in ${templateName}.`);
    }
    return rendered;
}

export async function renderFiles(profile, fileMap, values) {
    const files = new Map();
    for (const [outputPath, templatePath] of Object.entries(fileMap)) {
        files.set(outputPath, await renderTemplate(profile, templatePath, values));
    }
    return files;
}
