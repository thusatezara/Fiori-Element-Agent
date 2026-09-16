import { createHash } from "node:crypto";

function quote(value) {
    return JSON.stringify(String(value));
}

export function renderDescriptor(topology) {
    const lines = [`_schema-version: ${quote(topology.schemaVersion)}`, `ID: ${quote(topology.id)}`, `version: ${quote(topology.version)}`];
    if (topology.parameters) {
        lines.push("parameters:");
        for (const [key, value] of Object.entries(topology.parameters).sort(([a], [b]) => a.localeCompare(b))) lines.push(`  ${key}: ${typeof value === "boolean" ? value : quote(value)}`);
    }
    if (topology.buildParameters?.beforeAll?.length) {
        lines.push("build-parameters:", "  before-all:");
        for (const step of topology.buildParameters.beforeAll) {
            lines.push(`    - builder: ${quote(step.builder)}`, "      commands:");
            for (const command of step.commands) lines.push(`        - ${quote(command)}`);
        }
    }
    lines.push("modules:");
    for (const module of topology.modules) {
        lines.push(`  - name: ${quote(module.name)}`, `    type: ${quote(module.type)}`, `    path: ${quote(module.path)}`);
        if (module.parameters) {
            lines.push("    parameters:");
            for (const [key, value] of Object.entries(module.parameters).sort(([a], [b]) => a.localeCompare(b))) lines.push(`      ${key}: ${typeof value === "boolean" ? value : quote(value)}`);
        }
        if (module.buildParameters) lines.push("    build-parameters:", `      builder: ${quote(module.buildParameters.builder)}`);
        if (module.requires?.length) {
            lines.push("    requires:");
            for (const item of module.requires) lines.push(`      - name: ${quote(item.name)}`);
        }
        if (module.provides?.length) {
            lines.push("    provides:");
            for (const item of module.provides) {
                lines.push(`      - name: ${quote(item.name)}`);
                if (item.properties) {
                    lines.push("        properties:");
                    for (const [key, value] of Object.entries(item.properties).sort(([a], [b]) => a.localeCompare(b))) lines.push(`          ${key}: ${quote(value)}`);
                }
            }
        }
    }
    if (topology.resources.length) {
        lines.push("resources:");
        for (const resource of topology.resources) {
            lines.push(`  - name: ${quote(resource.name)}`, `    type: ${quote(resource.type)}`, "    parameters:");
            for (const [key, value] of Object.entries(resource.parameters).sort(([a], [b]) => a.localeCompare(b))) lines.push(`      ${key}: ${typeof value === "object" ? quote(JSON.stringify(value)) : quote(value)}`);
        }
    }
    return `${lines.join("\n")}\n`;
}

export function fingerprintDescriptor(descriptor) {
    return createHash("sha256").update(descriptor).digest("hex");
}
