export function createGenerationContext({ request, service, assessment, projectName, outputDirectory, metadataHash, flpIntent = null }) {
    if (!request || !service || !assessment || !projectName || !outputDirectory || !metadataHash) {
        throw new Error("Generation context is incomplete.");
    }

    return {
        request,
        service,
        assessment,
        projectName,
        outputDirectory,
        metadataHash,
        flpIntent,
        namespace: createNamespace(projectName)
    };
}

export function createNamespace(projectName) {
    const segments = String(projectName)
        .split(/[._-]+/)
        .filter(Boolean)
        .map((segment) => segment.replace(/[^A-Za-z0-9]/g, ""));
    return `com.fiori.agent.${segments.join(".") || "app"}`;
}

export function sanitizeProjectName(value) {
    const normalized = String(value ?? "")
        .toLowerCase()
        .replace(/[^a-z0-9._-]+/g, "-")
        .replace(/^-+|-+$/g, "");
    if (!normalized) {
        throw new Error("Project name cannot be empty.");
    }
    return normalized;
}

export function safeIdentifier(value) {
    const normalized = String(value).replace(/[^A-Za-z0-9_]/g, "_");
    return /^[A-Za-z_]/.test(normalized) ? normalized : `Entity_${normalized}`;
}
