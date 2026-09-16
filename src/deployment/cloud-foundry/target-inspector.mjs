import { createHash } from "node:crypto";

export function canonicalizeTarget(target) {
    const api = new URL(target.api);
    api.pathname = api.pathname.replace(/\/$/, "");
    return { api: api.toString().replace(/\/$/, ""), org: target.org.trim(), space: target.space.trim(), stage: target.stage };
}

export function targetFingerprint(target) {
    return createHash("sha256").update(JSON.stringify(canonicalizeTarget(target))).digest("hex");
}

export function parseCfTarget(output) {
    const value = String(output);
    const match = (label) => value.match(new RegExp(`^${label}:\\s*(.+)$`, "mi"))?.[1]?.trim() ?? null;
    return { api: match("API endpoint"), user: match("user"), org: match("org"), space: match("space") };
}

export async function inspectTarget(target, adapter) {
    const result = await adapter.run(["target"]);
    const observed = parseCfTarget(`${result.stdout}\n${result.stderr}`);
    const requested = canonicalizeTarget(target);
    const passed = result.code === 0 && observed.api === requested.api && observed.org === requested.org && observed.space === requested.space && Boolean(observed.user);
    return { passed, requested, observed: { api: observed.api, org: observed.org, space: observed.space, session: observed.user ? "CONFIRMED" : "UNCONFIRMED" } };
}

