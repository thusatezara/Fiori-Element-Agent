import { spawn } from "node:child_process";
import path from "node:path";

function defaultExecutable() {
    if (process.platform !== "win32") return "mbt";
    return path.join(process.env.APPDATA, "npm", "node_modules", "mbt", "unpacked_bin", "mbt.exe");
}

export function createMbtBuildAdapter({ executable = defaultExecutable() } = {}) {
    return {
        async build({ cwd, archiveDirectory }) {
            return new Promise((resolve) => {
                const child = spawn(executable, ["build", "-p", "cf", "-t", archiveDirectory], { cwd, shell: false, windowsHide: true });
                let output = "";
                child.stdout.on("data", (chunk) => { output += chunk; });
                child.stderr.on("data", (chunk) => { output += chunk; });
                child.on("error", (error) => resolve({ passed: false, code: null, output: error.message }));
                child.on("close", (code) => resolve({ passed: code === 0, code, output }));
            });
        }
    };
}
