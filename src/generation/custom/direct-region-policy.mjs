export function createDirectRegionPolicy(regions) {
    const direct = regions.filter((region) => region.kind === "direct");
    return {
        enabled: direct.length > 0,
        regions: direct.map(({ id, purpose }) => ({ id, purpose })),
        boundary: "Direct region is client-side only and must not implement backend authorization, transaction, or business rules.",
        standardAlternative: "Use a Fiori elements Building Block or annotation first; direct UI is retained only for the explicit interaction requirement.",
        validation: "Static fragment/controller path and report trace; runtime interaction needs application-specific OPA5 validation."
    };
}
