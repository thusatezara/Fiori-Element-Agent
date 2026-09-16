export function createFakeCfAdapter({ target = { api: "https://api.cf.example.test", org: "demo-org", space: "dev" }, deployCode = 0, appHealthy = true } = {}) {
    const calls = [];
    return {
        calls,
        async run(args) {
            calls.push([...args]);
            if (args[0] === "target") return { code: 0, stdout: `API endpoint:   ${target.api}\nuser:           developer@example.test\norg:            ${target.org}\nspace:          ${target.space}\n`, stderr: "", timedOut: false };
            if (args[0] === "version") return { code: 0, stdout: "cf version 8.17.1", stderr: "", timedOut: false };
            if (args[0] === "plugins") return { code: 0, stdout: "multiapps 3.11.1 deploy", stderr: "", timedOut: false };
            if (args[0] === "curl") return { code: 0, stdout: '{"resources":[]}', stderr: "", timedOut: false };
            if (args[0] === "marketplace") return { code: 0, stdout: "free standard", stderr: "", timedOut: false };
            if (args[0] === "deploy") return { code: deployCode, stdout: deployCode === 0 ? "Process ID: 12345678-abcd-4abc-8abc-123456789abc\nProcess finished." : "", stderr: deployCode === 0 ? "" : "deployment failed", timedOut: false };
            if (args[0] === "app") return appHealthy
                ? { code: 0, stdout: `name: ${args[1]}\nstate: started\nroutes: demo.example.test\ninstances: 1/1\n`, stderr: "", timedOut: false }
                : { code: 1, stdout: "", stderr: "app unavailable", timedOut: false };
            throw new Error(`Unexpected fake CF command: ${args.join(" ")}`);
        }
    };
}

