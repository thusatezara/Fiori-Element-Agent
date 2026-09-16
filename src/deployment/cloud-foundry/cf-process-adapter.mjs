import { spawn } from "node:child_process";

const ALLOWED = new Set(["version", "target", "plugins", "curl", "marketplace", "deploy", "app", "mta-ops"]);
const SECRET_OUTPUT = /(authorization|bearer|client[_-]?secret|password|token)\s*[:=]\s*\S+/gi;

export function redactOutput(value) {
    return String(value ?? "").replace(SECRET_OUTPUT, "$1=[REDACTED]");
}

export function createCfProcessAdapter({ executable = process.platform === "win32" ? "cf.exe" : "cf", timeoutMs = 20 * 60 * 1000 } = {}) {
    return {
        async run(args) {
            if (!Array.isArray(args) || !ALLOWED.has(args[0])) throw new Error(`CF command is not allowlisted: ${args?.[0]}`);
            return new Promise((resolve) => {
                const child = spawn(executable, args, { shell: false, windowsHide: true });
                let stdout = "";
                let stderr = "";
                let settled = false;
                const timer = setTimeout(() => {
                    settled = true;
                    child.kill();
                    resolve({ code: null, timedOut: true, stdout: redactOutput(stdout), stderr: redactOutput(stderr) });
                }, timeoutMs);
                child.stdout.on("data", (chunk) => { stdout += chunk; });
                child.stderr.on("data", (chunk) => { stderr += chunk; });
                child.on("error", (error) => {
                    if (settled) return;
                    settled = true;
                    clearTimeout(timer);
                    resolve({ code: null, timedOut: false, stdout: "", stderr: redactOutput(error.message) });
                });
                child.on("close", (code) => {
                    if (settled) return;
                    settled = true;
                    clearTimeout(timer);
                    resolve({ code, timedOut: false, stdout: redactOutput(stdout), stderr: redactOutput(stderr) });
                });
            });
        }
    };
}
