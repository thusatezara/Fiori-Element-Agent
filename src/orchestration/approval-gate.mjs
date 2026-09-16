const SECRET_KEY = /(^|_)(authorization|password|passwd|token|secret|client_secret|api_key)($|_)/i;

export function containsCredential(value, key = "") {
    if (SECRET_KEY.test(key)) {
        const authorizationIntent = /^authorization$/i.test(key) && (Array.isArray(value) || (value && typeof value === "object"));
        const emptyValue = value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0);
        if (!authorizationIntent && !emptyValue) return true;
    }
    if (Array.isArray(value)) return value.some((item) => containsCredential(item));
    if (value && typeof value === "object") {
        return Object.entries(value).some(([childKey, childValue]) => containsCredential(childValue, childKey));
    }
    if (typeof value !== "string") return false;
    try {
        const url = new URL(value);
        if (url.username || url.password) return true;
        return [...url.searchParams.keys()].some((name) => SECRET_KEY.test(name));
    } catch {
        return /(?:authorization|password|token|secret|api[_-]?key)\s*[:=]/i.test(value);
    }
}

function missingFields(target, fields) {
    return fields.filter((field) => !String(target?.[field] ?? "").trim());
}

export function evaluateApprovalGate(scope, request) {
    if (!request.externalChangeIntent) {
        return { ready: false, reasons: ["Explicit external change intent is required."] };
    }

    const target = scope === "DEPLOY_CF"
        ? request.requestedTargets?.cloudFoundry
        : request.requestedTargets?.workZone;
    if (containsCredential(target)) {
        return { ready: false, reasons: ["Target references must not contain credential values."] };
    }

    const fields = scope === "DEPLOY_CF"
        ? ["api", "org", "space", "stage"]
        : ["edition", "subaccount", "site", "contentTarget"];
    const missing = missingFields(target, fields);
    if (missing.length > 0) {
        return { ready: false, reasons: [`Missing target fields: ${missing.join(", ")}.`] };
    }

    if (scope === "DEPLOY_CF") {
        try {
            const api = new URL(target.api);
            if (api.protocol !== "https:") return { ready: false, reasons: ["Cloud Foundry api must use HTTPS."] };
        } catch {
            return { ready: false, reasons: ["Cloud Foundry api must be a valid HTTPS URL."] };
        }
        if (!["DEV", "TEST", "PROD"].includes(target.stage)) {
            return { ready: false, reasons: ["Cloud Foundry stage must be DEV, TEST or PROD."] };
        }
    }

    if (scope === "PUBLISH_WORK_ZONE" && !["STANDARD", "ADVANCED"].includes(target.edition)) {
        return { ready: false, reasons: ["Work Zone edition must be STANDARD or ADVANCED."] };
    }

    return { ready: true, reasons: [] };
}
