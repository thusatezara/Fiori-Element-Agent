import { createHash } from "node:crypto";

export function extractUrl(text) {
    return String(text ?? "").match(/https?:\/\/[^\s"'<>]+/)?.[0]?.replace(/[),.;]+$/, "") ?? null;
}

export function parseServiceInput(input, explicitEntitySet) {
    const url = new URL(input);
    url.hash = "";
    url.search = "";
    const rawSegments = url.pathname.split("/").filter(Boolean);
    const lastSegment = rawSegments.at(-1) ?? "";
    const entityFromUrl = url.pathname.endsWith("/") ? null : stripKeyPredicate(lastSegment);
    const entitySet = explicitEntitySet || (entityFromUrl && !entityFromUrl.startsWith("$") ? entityFromUrl : null);
    const serviceSegments = entitySet && !url.pathname.endsWith("/") && rawSegments.at(-1) === lastSegment
        ? rawSegments.slice(0, -1)
        : rawSegments;
    const servicePath = `/${serviceSegments.join("/")}${serviceSegments.length ? "/" : ""}`;
    return {
        inputUrl: input,
        origin: url.origin,
        servicePath,
        serviceRoot: `${url.origin}${servicePath}`,
        metadataUrl: `${url.origin}${servicePath}$metadata`,
        entitySet
    };
}

export async function readMetadata(serviceInput, metadataFile) {
    if (metadataFile) {
        const { readFile } = await import("node:fs/promises");
        return readFile(metadataFile, "utf8");
    }
    const response = await fetch(serviceInput.metadataUrl, { headers: { accept: "application/xml,text/xml" } });
    if (!response.ok) {
        throw new Error(`Unable to read OData metadata (${response.status} ${response.statusText}): ${serviceInput.metadataUrl}`);
    }
    return response.text();
}

export function parseODataMetadata(xml, serviceInput, explicitEntitySet) {
    const source = String(xml).replace(/<!--[\s\S]*?-->/g, "");
    const odataVersion = detectODataVersion(source);
    const schemas = [...source.matchAll(/<Schema\b([^>]*)>([\s\S]*?)<\/Schema>/gi)];
    if (!schemas.length) throw new Error("The metadata document does not contain an OData Schema.");

    const entitySets = [];
    const entityTypes = new Map();
    for (const schemaMatch of schemas) {
        const schemaAttributes = readAttributes(schemaMatch[1]);
        const namespace = schemaAttributes.Namespace ?? "";
        const schemaBody = schemaMatch[2];
        for (const match of schemaBody.matchAll(/<EntitySet\b([^>]*)\/?\s*>/gi)) {
            const attributes = readAttributes(match[1]);
            if (attributes.Name && attributes.EntityType) entitySets.push({ name: attributes.Name, entityType: attributes.EntityType, namespace });
        }
        for (const match of schemaBody.matchAll(/<EntityType\b([^>]*)>([\s\S]*?)<\/EntityType>/gi)) {
            const attributes = readAttributes(match[1]);
            if (!attributes.Name) continue;
            const fullName = `${namespace}.${attributes.Name}`;
            const body = match[2];
            const properties = [...body.matchAll(/<Property\b([^>]*)\/?\s*>/gi)]
                .map((propertyMatch) => readAttributes(propertyMatch[1]))
                .filter((property) => property.Name && property.Type)
                .map((property) => ({ name: property.Name, type: property.Type, nullable: property.Nullable !== "false", label: humanize(property.Name), isPrimitive: !property.Type.startsWith("Collection(") }));
            const navigationProperties = [...body.matchAll(/<NavigationProperty\b([^>]*)\/?\s*>/gi)]
                .map((navigationMatch) => readAttributes(navigationMatch[1]).Name)
                .filter(Boolean);
            const keyBlock = body.match(/<Key\b[^>]*>([\s\S]*?)<\/Key>/i)?.[1] ?? "";
            const keys = [...keyBlock.matchAll(/<PropertyRef\b([^>]*)\/?\s*>/gi)]
                .map((keyMatch) => readAttributes(keyMatch[1]).Name)
                .filter(Boolean);
            entityTypes.set(fullName, { name: attributes.Name, fullName, namespace, properties, navigationProperties, keys });
        }
    }

    if (!entitySets.length) throw new Error("The metadata document does not contain an EntitySet.");
    const entitySetName = explicitEntitySet || serviceInput.entitySet || entitySets[0].name;
    const entitySet = entitySets.find((candidate) => candidate.name === entitySetName);
    if (!entitySet) throw new Error(`EntitySet '${entitySetName}' was not found in the OData metadata.`);
    const entityTypeName = entitySet.entityType.includes(".") ? entitySet.entityType : `${entitySet.namespace}.${entitySet.entityType}`;
    const entityType = entityTypes.get(entityTypeName);
    if (!entityType) throw new Error(`EntityType '${entityTypeName}' was not found for EntitySet '${entitySetName}'.`);
    if (!entityType.properties.length) throw new Error(`EntityType '${entityTypeName}' has no readable properties.`);

    return {
        ...serviceInput,
        namespace: entityType.namespace,
        odataVersion,
        entitySet: entitySet.name,
        entityType: entityType.fullName,
        entityTypeName: entityType.name,
        keys: entityType.keys.length ? entityType.keys : [entityType.properties[0].name],
        properties: entityType.properties,
        navigationProperties: entityType.navigationProperties,
        entitySets: entitySets.map(({ name, entityType: type }) => ({ name, entityType: type }))
    };
}

export function metadataHash(metadataXml) {
    return createHash("sha256").update(metadataXml).digest("hex");
}

function detectODataVersion(xml) {
    const edmxVersion = xml.match(/<edmx:Edmx\b[^>]*\bVersion="([^"]+)"/i)?.[1];
    if (edmxVersion === "4.0" || /http:\/\/docs\.oasis-open\.org\/odata\/ns\/edmx/i.test(xml)) return "4.0";
    const dataServiceVersion = xml.match(/DataServiceVersion="([^"]+)"/i)?.[1];
    return dataServiceVersion?.startsWith("1") ? "1.0" : "2.0";
}

function readAttributes(text) {
    const attributes = {};
    for (const match of String(text).matchAll(/([\w:.-]+)\s*=\s*"([^"]*)"/g)) attributes[match[1]] = decodeXml(match[2]);
    return attributes;
}

function decodeXml(value) {
    return String(value).replaceAll("&quot;", '"').replaceAll("&apos;", "'").replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&amp;", "&");
}

export function humanize(value) {
    return String(value).replaceAll("_", " ").replace(/([a-z])([A-Z])/g, "$1 $2").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function stripKeyPredicate(segment) {
    return decodeURIComponent(segment).replace(/\([^)]*\)$/, "");
}
