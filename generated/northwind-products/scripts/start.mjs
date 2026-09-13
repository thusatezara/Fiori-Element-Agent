import http from "node:http";
import https from "node:https";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectDirectory = resolve(scriptDirectory, "..");
const bridgePort = Number(process.env.NORTHWIND_BRIDGE_PORT || 4004);
const requestedPortIndex = process.argv.indexOf("--port");
const ui5Port = requestedPortIndex >= 0 ? process.argv[requestedPortIndex + 1] : "8080";
const noOpen = process.argv.includes("--no-open");
const standalone = process.argv.includes("--standalone");
const openTarget = standalone
    ? "index.html?sap-ui-xx-viewCache=false"
    : "test/flpSandbox.html?sap-ui-xx-viewCache=false#products-display";

const bridge = http.createServer((request, response) => {
    const target = new URL(request.url || "/", "https://services.odata.org");
    const headers = { ...request.headers, host: target.host };
    delete headers["accept-encoding"];
    const upstream = https.request(target, { method: request.method, headers }, (upstreamResponse) => {
        const responseHeaders = { ...upstreamResponse.headers };
        // The public sample emits the invalid value "4.0;". Keep the required
        // batch response header but normalize it to the exact V4 value.
        responseHeaders["odata-version"] = "4.0";

        if (target.pathname.endsWith("/$batch")) {
            const chunks = [];
            upstreamResponse.on("data", (chunk) => chunks.push(chunk));
            upstreamResponse.on("end", () => {
                const normalizedBody = Buffer.from(
                    Buffer.concat(chunks).toString("utf8").replaceAll("OData-Version: 4.0;", "OData-Version: 4.0")
                );
                delete responseHeaders["transfer-encoding"];
                responseHeaders["content-length"] = String(normalizedBody.length);
                response.writeHead(upstreamResponse.statusCode || 502, responseHeaders);
                response.end(normalizedBody);
            });
            return;
        }

        response.writeHead(upstreamResponse.statusCode || 502, responseHeaders);
        upstreamResponse.pipe(response);
    });

    upstream.on("error", (error) => {
        if (!response.headersSent) {
            response.writeHead(502, { "content-type": "text/plain; charset=utf-8" });
        }
        response.end(`Northwind proxy failed: ${error.message}`);
    });
    request.pipe(upstream);
});

bridge.on("error", (error) => {
    console.error(`Northwind header bridge failed on port ${bridgePort}: ${error.message}`);
    process.exitCode = 1;
});

bridge.listen(bridgePort, "127.0.0.1", () => {
    const cli = resolve(projectDirectory, "node_modules", "@sap", "ux-ui5-tooling", "bin", "fiori.cjs");
    const args = [cli, "run", "--port", ui5Port];
    if (!noOpen) {
        args.push("--open", openTarget);
    }

    const child = spawn(process.execPath, args, {
        cwd: projectDirectory,
        env: process.env,
        stdio: "inherit"
    });

    const stop = () => child.kill("SIGTERM");
    process.once("SIGINT", stop);
    process.once("SIGTERM", stop);
    child.once("exit", (code, signal) => {
        bridge.close(() => {
            process.exitCode = code ?? (signal ? 1 : 0);
        });
    });
});
