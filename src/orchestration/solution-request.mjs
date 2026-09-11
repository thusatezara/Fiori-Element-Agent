import { randomUUID } from "node:crypto";
import { containsCredential } from "./approval-gate.mjs";

const ORDER = Object.freeze(["BACKEND", "FRONTEND", "PACKAGE", "DEPLOY_CF", "PUBLISH_WORK_ZONE"]);
const MATCHERS = Object.freeze({
    BACKEND: [/\bcap\b/i, /\bbackend\b/i, /백엔드/i, /\bcds\b/i, /domain model/i, /데이터 모델/i],
    FRONTEND: [/fiori/i, /sapui5/i, /\bfrontend\b/i, /프론트엔드/i, /화면/i, /\bui\b/i, /애플리케이션/i, /앱/i, /\bapp\b/i],
    PACKAGE: [/\bmta\b/i, /패키징/i, /package/i, /통합 구성/i],
    DEPLOY_CF: [/cloud foundry/i, /\bcf\b/i, /배포/i, /deploy/i],
    PUBLISH_WORK_ZONE: [/work\s*zone/i, /workzone/i, /타일/i, /\btile\b/i]
});

function classify(text) {
    const matched = new Map();
    for (const [scope, patterns] of Object.entries(MATCHERS)) {
        const terms = patterns.filter((pattern) => pattern.test(text)).map((pattern) => pattern.source);
        if (terms.length > 0) matched.set(scope, terms);
    }
    if (matched.size === 0) {
        throw new Error("Solution scope could not be determined. Mention Frontend, CAP, MTA, Cloud Foundry or Work Zone intent.");
    }

    if (matched.has("PUBLISH_WORK_ZONE")) {
        matched.set("DEPLOY_CF", matched.get("DEPLOY_CF") ?? ["required-by:PUBLISH_WORK_ZONE"]);
        matched.set("PACKAGE", matched.get("PACKAGE") ?? ["required-by:DEPLOY_CF"]);
    } else if (matched.has("DEPLOY_CF")) {
        matched.set("PACKAGE", matched.get("PACKAGE") ?? ["required-by:DEPLOY_CF"]);
    }

    return {
        scopes: ORDER.filter((scope) => matched.has(scope)),
        evidence: ORDER.filter((scope) => matched.has(scope)).map((scope) => ({
            scope,
            source: matched.get(scope).some((term) => term.startsWith("required-by:")) ? "DEPENDENCY" : "REQUEST",
            matches: matched.get(scope)
        }))
    };
}

function normalizeCloudFoundry(target = {}) {
    return {
        api: target.api ? String(target.api).trim() : null,
        org: target.org ? String(target.org).trim() : null,
        space: target.space ? String(target.space).trim() : null,
        stage: target.stage ? String(target.stage).trim().toUpperCase() : null
    };
}

function normalizeWorkZone(target = {}) {
    return {
        edition: target.edition ? String(target.edition).trim().toUpperCase() : null,
        subaccount: target.subaccount ? String(target.subaccount).trim() : null,
        site: target.site ? String(target.site).trim() : null,
        contentTarget: target.contentTarget ? String(target.contentTarget).trim() : null
    };
}

export function normalizeSolutionRequest(input = {}) {
    const originalText = String(input.request ?? "").trim();
    if (!originalText) throw new Error("A natural-language solution request is required.");
    if (containsCredential(originalText)) {
        throw new Error("The solution request must not contain credential values.");
    }
    const classification = classify(originalText);
    const externalChangeIntent = classification.evidence.some(({ scope, source }) =>
        source === "REQUEST" && ["DEPLOY_CF", "PUBLISH_WORK_ZONE"].includes(scope));

    const requestedTargets = {
        cloudFoundry: normalizeCloudFoundry(input.cloudFoundry),
        workZone: normalizeWorkZone(input.workZone)
    };
    if (containsCredential(requestedTargets)) {
        throw new Error("Target references must not contain credential values.");
    }

    return {
        requestId: randomUUID(),
        originalText,
        scopes: classification.scopes,
        evidence: classification.evidence,
        requestedTargets,
        externalChangeIntent,
        createdAt: new Date().toISOString()
    };
}
