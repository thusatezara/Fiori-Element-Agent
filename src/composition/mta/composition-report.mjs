export function compositionBlocked(errors, request = {}) {
    return {
        resultVersion: "1.0",
        protocol: { id: "200", version: "1.0" },
        status: "BLOCKED",
        descriptorFingerprint: "0".repeat(64),
        sourceResultIds: (request.components ?? []).map(({ resultId }) => resultId),
        serviceRequirements: request.requirements ?? [],
        validation: [],
        blockingReasons: errors.map((message) => ({ code: "PREFLIGHT_FAILED", message }))
    };
}

