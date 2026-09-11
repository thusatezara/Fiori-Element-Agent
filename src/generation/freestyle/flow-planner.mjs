export function planFlow(request) {
    const normalized = String(request).toLowerCase();
    const multiStep = /wizard|multi[- ]step|다단계|단계별|검토 후|review/i.test(normalized);
    const screens = multiStep ? ["main", "review"] : ["main"];
    const transitions = multiStep ? [{ from: "main", event: "next", to: "review" }, { from: "review", event: "back", to: "main" }] : [];
    return {
        startScreen: "main",
        screens,
        transitions,
        backBehavior: "UI state is kept in the view JSONModel while OData data remains in the OData model."
    };
}
