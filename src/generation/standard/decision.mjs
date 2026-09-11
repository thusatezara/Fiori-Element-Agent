import { humanize } from "../../orchestration/service-inspection.mjs";

export function chooseColumns(service, request = "") {
    const available = service.properties.filter((property) => property.isPrimitive);
    const keyColumns = service.keys.map((key) => available.find((property) => property.name === key)).filter(Boolean);
    const requested = available.filter((property) => {
        const normalizedRequest = String(request).toLowerCase();
        return normalizedRequest.includes(property.name.toLowerCase()) || normalizedRequest.includes(property.label.toLowerCase());
    });
    return [...new Map([...keyColumns, ...requested, ...available].map((property) => [property.name, property])).values()].slice(0, 8);
}

export function chooseFilters(columns) {
    const filterable = columns.filter((property) => /String|Boolean|Int|Decimal|Date|Time/.test(property.type));
    return (filterable.length ? filterable : columns).slice(0, 5);
}

export function chooseTitleProperty(columns) {
    return columns.find((property) => /title|name|description|text|label/i.test(property.name))
        ?? columns.find((property) => property.type.includes("String"))
        ?? columns[0];
}

export function chooseDescriptionProperty(columns, titleProperty) {
    return columns.find((property) => property.name !== titleProperty.name && /description|descr|text|name/i.test(property.name)) ?? null;
}

export function createStandardDecision(context) {
    const columns = chooseColumns(context.service, context.request);
    const filters = chooseFilters(columns);
    const titleProperty = chooseTitleProperty(columns);
    const descriptionProperty = chooseDescriptionProperty(columns, titleProperty);
    return {
        columns,
        filters,
        titleProperty,
        descriptionProperty,
        tableType: "ResponsiveTable",
        editMode: "Standard Object Page; no inline edit unless capability is confirmed",
        userLanguageSummary: `EntitySet ${context.service.entitySet} is exposed as a searchable List Report with an optional detail Object Page.`,
        humanizedEntity: humanize(context.service.entitySet)
    };
}
