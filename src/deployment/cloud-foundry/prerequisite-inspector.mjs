export async function inspectPrerequisites(adapter, serviceRequirements = []) {
    const [version, plugins, access] = await Promise.all([
        adapter.run(["version"]),
        adapter.run(["plugins"]),
        adapter.run(["curl", "/v3/apps?per_page=1"])
    ]);
    const pluginText = `${plugins.stdout}\n${plugins.stderr}`;
    const checks = [
        { name: "cf-cli", status: version.code === 0 ? "PASSED" : "FAILED" },
        { name: "multiapps-plugin", status: plugins.code === 0 && /multiapps/i.test(pluginText) ? "PASSED" : "FAILED" },
        { name: "space-role", status: access.code === 0 ? "PASSED" : "FAILED" }
    ];
    for (const requirement of serviceRequirements) {
        const marketplace = await adapter.run(["marketplace", "-e", requirement.offering]);
        checks.push({ name: `service:${requirement.offering}/${requirement.plan}`, status: marketplace.code === 0 && marketplace.stdout.includes(requirement.plan) ? "PASSED" : "FAILED" });
    }
    return checks;
}

