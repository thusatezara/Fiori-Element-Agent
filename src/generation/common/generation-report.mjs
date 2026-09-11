export function createGenerationReport(context, generated, validation) {
    return {
        generatorVersion: "2.0.0",
        protocol: {
            entry: "001",
            handoff: context.assessment.handoff,
            selectedGenerator: context.assessment.handoff
        },
        requestSummary: sanitizeRequestText(context.request),
        assessment: context.assessment,
        service: summarizeService(context.service, context.metadataHash),
        generated,
        validation
    };
}

export function summarizeService(service, metadataHash) {
    return {
        odataVersion: service.odataVersion,
        serviceRoot: service.serviceRoot,
        entitySet: service.entitySet,
        entityType: service.entityType,
        keys: service.keys,
        properties: service.properties.map(({ name, type, label }) => ({ name, type, label })),
        navigationProperties: service.navigationProperties,
        metadataHash
    };
}

export function sanitizeRequestText(value) {
    return String(value)
        .replace(/(https?:\/\/)([^\s/@]+):([^\s/@]+)@/gi, "$1[redacted]@")
        .replace(/\b(token|password|passwd|authorization|auth)\s*[:=]\s*[^\s,;]+/gi, "$1=[redacted]");
}
