export async function validateDeployment({ applicationId, deployResult, adapter }) {
    const app = await adapter.run(["app", applicationId]);
    const appText = `${app.stdout}\n${app.stderr}`;
    const operationPassed = deployResult.code === 0 && !deployResult.timedOut;
    const healthPassed = app.code === 0 && /instances:\s*[1-9]\d*\/[1-9]\d*/i.test(appText);
    const routeMatch = appText.match(/^routes:\s*(.+)$/mi);
    const routePassed = app.code === 0 && Boolean(routeMatch?.[1]?.trim());
    return {
        checks: [
            { name: "operation", status: deployResult.timedOut ? "UNKNOWN" : operationPassed ? "PASSED" : "FAILED" },
            { name: "application-health", status: healthPassed ? "PASSED" : "FAILED" },
            { name: "route", status: routePassed ? "PASSED" : "FAILED" }
        ],
        route: routeMatch?.[1]?.split(",")[0]?.trim() ?? null
    };
}

