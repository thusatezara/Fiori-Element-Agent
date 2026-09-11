const XML_NS = "http://docs.oasis-open.org/odata/ns/edm";

export function createAnnotationXml({ service, columns, filters, titleProperty, descriptionProperty }) {
    const lineItems = columns.map((property) => `                <Record Type="UI.DataField"><PropertyValue Property="Value" Path="${xml(property.name)}" /><PropertyValue Property="Label" String="${xml(property.label)}" /></Record>`).join("\n");
    const selectionFields = filters.map((property) => `                <PropertyPath>${xml(property.name)}</PropertyPath>`).join("\n");
    const fieldGroup = columns.slice(0, 12).map((property) => `                                <Record Type="UI.DataField"><PropertyValue Property="Value" Path="${xml(property.name)}" /><PropertyValue Property="Label" String="${xml(property.label)}" /></Record>`).join("\n");
    return `<?xml version="1.0" encoding="UTF-8"?>
<edmx:Edmx xmlns:edmx="http://docs.oasis-open.org/odata/ns/edmx" Version="4.0">
    <edmx:Reference Uri="https://sap.github.io/odata-vocabularies/vocabularies/UI.xml"><edmx:Include Namespace="com.sap.vocabularies.UI.v1" Alias="UI" /></edmx:Reference>
    <edmx:Reference Uri="https://sap.github.io/odata-vocabularies/vocabularies/Common.xml"><edmx:Include Namespace="com.sap.vocabularies.Common.v1" Alias="Common" /></edmx:Reference>
    <edmx:DataServices>
        <Schema xmlns="${XML_NS}" Namespace="${xml(service.namespace || service.entityType.split(".").slice(0, -1).join("."))}.annotations">
            <Annotations Target="${xml(service.entityType)}">
                <Annotation Term="UI.HeaderInfo"><Record Type="UI.HeaderInfoType"><PropertyValue Property="TypeName" String="${xml(service.entityTypeName)}" /><PropertyValue Property="TypeNamePlural" String="${xml(service.entitySet)}" /><PropertyValue Property="Title"><Record Type="UI.DataField"><PropertyValue Property="Value" Path="${xml(titleProperty.name)}" /></Record></PropertyValue>${descriptionProperty ? `<PropertyValue Property="Description"><Record Type="UI.DataField"><PropertyValue Property="Value" Path="${xml(descriptionProperty.name)}" /></Record></PropertyValue>` : ""}</Record></Annotation>
                <Annotation Term="UI.SelectionFields"><Collection>
${selectionFields}
                </Collection></Annotation>
                <Annotation Term="UI.LineItem"><Collection>
${lineItems}
                </Collection></Annotation>
                <Annotation Term="UI.Facets"><Collection><Record Type="UI.ReferenceFacet"><PropertyValue Property="ID" String="details" /><PropertyValue Property="Label" String="Details" /><PropertyValue Property="Target" AnnotationPath="@UI.FieldGroup#details" /></Record></Collection></Annotation>
                <Annotation Term="UI.FieldGroup" Qualifier="details"><Record Type="UI.FieldGroupType"><PropertyValue Property="Label" String="Details" /><PropertyValue Property="Data"><Collection>
${fieldGroup}
                </Collection></PropertyValue></Record></Annotation>
            </Annotations>
        </Schema>
    </edmx:DataServices>
</edmx:Edmx>
`;
}

function xml(value) {
    return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
}
