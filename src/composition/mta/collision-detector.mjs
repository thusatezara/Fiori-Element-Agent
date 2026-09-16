export function detectCollisions(topology) {
    const errors = [];
    for (const [kind, entries] of [["module", topology.modules], ["resource", topology.resources]]) {
        const seen = new Map();
        for (const entry of entries) {
            const canonical = JSON.stringify(entry);
            if (seen.has(entry.name) && seen.get(entry.name) !== canonical) errors.push(`${kind} configuration collision: ${entry.name}`);
            else if (seen.has(entry.name)) errors.push(`Duplicate ${kind}: ${entry.name}`);
            seen.set(entry.name, canonical);
        }
    }
    const resources = new Set(topology.resources.map(({ name }) => name));
    for (const module of topology.modules) {
        for (const dependency of module.requires ?? []) if (!resources.has(dependency.name)) errors.push(`Unknown resource reference ${dependency.name} from ${module.name}.`);
    }
    return errors;
}

