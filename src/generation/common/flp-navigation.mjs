export function createFlpNavigation(context) {
    const defaultSemanticObject = toIntentSegment(context.service.entitySet);
    const inboundKey = String(context.flpIntent ?? `${defaultSemanticObject}-display`).trim();
    const separator = inboundKey.lastIndexOf("-");
    if (separator <= 0 || separator === inboundKey.length - 1) {
        throw new Error("FLP intent must use the '<semantic-object>-<action>' format.");
    }

    const semanticObject = inboundKey.slice(0, separator);
    const action = inboundKey.slice(separator + 1);
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(semanticObject) || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(action)) {
        throw new Error("FLP semantic object and action may contain only letters, numbers, '.', '_' and '-'.");
    }

    return { inboundKey, semanticObject, action };
}

export function createFlpSandboxConfig({ appTitle, appDescription, namespace, navigation }) {
    return {
        defaultRenderer: "fiori2",
        applications: {
            [navigation.inboundKey]: {
                title: appTitle,
                description: appDescription,
                additionalInformation: `SAPUI5.Component=${namespace}`,
                applicationType: "URL",
                url: "../",
                navigationMode: "embedded"
            }
        }
    };
}

function toIntentSegment(value) {
    const normalized = String(value)
        .replace(/[^A-Za-z0-9]+/g, "")
        .toLowerCase();
    return normalized || "app";
}
