export function composeTopology(request, components) {
    const applicationId = request.identity.applicationId;
    const backends = components.filter(({ kind }) => kind === "BACKEND");
    const modules = [];
    const resources = [];
    const serviceRequirements = [];
    const buildCommands = [];
    let backendIndex = 0;
    for (const component of components) {
        if (component.kind === "BACKEND") {
            const suffix = backends.length === 1 ? "" : `-${backendIndex + 1}`;
            const deploymentPath = backends.length === 1 ? "backend" : `backend-${backendIndex + 1}`;
            const serviceName = `${applicationId}${suffix}-srv`;
            const dbName = `${applicationId}${suffix}-db`;
            const persistence = component.capabilities.persistence;
            const requires = persistence === "HANA" ? [{ name: dbName }] : [];
            modules.push({
                name: serviceName,
                type: "nodejs",
                path: `${deploymentPath}/gen/srv`,
                parameters: { buildpack: "nodejs_buildpack", memory: "256M", "disk-quota": "512M", "random-route": true },
                buildParameters: { builder: "npm" },
                requires,
                provides: [{ name: `${applicationId}${suffix}-srv-api`, properties: { "srv-url": "${default-url}" } }]
            });
            if (persistence === "HANA") {
                modules.push({
                    name: `${applicationId}${suffix}-db-deployer`,
                    type: "hdb",
                    path: `${deploymentPath}/gen/db`,
                    parameters: { buildpack: "nodejs_buildpack" },
                    requires: [{ name: dbName }]
                });
                resources.push({ name: dbName, type: "com.sap.xs.hdi-container", parameters: { service: "hana", "service-plan": "hdi-shared" } });
                serviceRequirements.push({ name: dbName, offering: "hana", plan: "hdi-shared" });
            }
            buildCommands.push(`npm --prefix ${deploymentPath} install`, `npm --prefix ${deploymentPath} exec -- cds build ${deploymentPath} --production`);
            backendIndex += 1;
            continue;
        }
        modules.push(...(component.capabilities?.modules ?? [{
            name: applicationId,
            type: "nodejs",
            path: "app",
            parameters: { memory: "128M", "disk-quota": "256M", "random-route": true },
            buildParameters: { builder: "npm" }
        }]));
    }
    for (const item of request.requirements ?? []) resources.push({
        name: item.name,
        type: "org.cloudfoundry.managed-service",
        parameters: { service: item.offering, "service-plan": item.plan, ...(item.configuration ? { config: item.configuration } : {}) }
    });
    serviceRequirements.push(...(request.requirements ?? []));
    return {
        schemaVersion: "3.3",
        id: applicationId,
        version: request.identity.version,
        parameters: { "enable-parallel-deployments": true },
        buildParameters: buildCommands.length ? { beforeAll: [{ builder: "custom", commands: buildCommands }] } : null,
        modules: modules.sort((a, b) => a.name.localeCompare(b.name)),
        resources: resources.sort((a, b) => a.name.localeCompare(b.name)),
        serviceRequirements: serviceRequirements.sort((a, b) => a.name.localeCompare(b.name))
    };
}
