export function enforceBackendBoundary(request) {
    if (/backend\s*(변경|구현)|authorization\s*(구현|우회)|transaction\s*(처리|구현)/i.test(String(request))) {
        throw new Error("Freestyle generator cannot implement backend rules, authorization, or transactions. Keep those responsibilities in the service.");
    }
    return {
        status: "PASS",
        rule: "Freestyle output owns only client screen state and interaction; OData service owns data and backend responsibilities."
    };
}
