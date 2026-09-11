export function planBuildingBlocks(service, regions) {
    const property = service.properties.find((candidate) => candidate.isPrimitive);
    if (!property) throw new Error("Custom Page requires at least one primitive property for a data context.");
    return regions.filter((region) => region.kind === "building-block").map((region) => ({
        regionId: region.id,
        block: region.id === "filterBar" ? "FilterBar" : region.id === "table" ? "Table" : "Form",
        contextPath: `/${service.entitySet}`,
        metaPath: region.id === "filterBar"
            ? "@com.sap.vocabularies.UI.v1.SelectionFields"
            : region.id === "table"
                ? "@com.sap.vocabularies.UI.v1.LineItem"
                : "@com.sap.vocabularies.UI.v1.FieldGroup#details",
        anchorProperty: property.name
    }));
}
