import { spawn } from "node:child_process";

export function runUi5Build(projectDirectory, timeoutMs = 120000) {
    return new Promise((resolve, reject) => {
        const child = spawn(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "build"], {
            cwd: projectDirectory,
            stdio: "pipe",
            env: { ...process.env, CI: "1" }
        });
        let output = "";
        const timer = setTimeout(() => {
            child.kill();
            reject(new Error(`UI5 build timed out after ${timeoutMs} ms.`));
        }, timeoutMs);
        child.stdout.on("data", (chunk) => { output += chunk; });
        child.stderr.on("data", (chunk) => { output += chunk; });
        child.on("error", (error) => { clearTimeout(timer); reject(error); });
        child.on("close", (code) => {
            clearTimeout(timer);
            if (code !== 0) {
                reject(new Error(`UI5 build failed with exit code ${code}. Output: ${output.slice(-4000)}`));
                return;
            }
            resolve({ status: "PASS", output: output.slice(-4000) });
        });
    });
}
