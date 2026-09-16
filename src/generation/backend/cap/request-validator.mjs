import path from "node:path";
import { containsCredential } from "../../../orchestration/approval-gate.mjs";
import { assertOutputInsideWorkspace } from "../../common/output-transaction.mjs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;
const REQUIREMENT_ID = /^[A-Za-z][A-Za-z0-9._-]*$/;

function object(value) {
    return value && typeof value === "object" && !Array.isArray(value);
}

export function validateCapHandoff(handoff, { workspaceRoot = process.cwd() } = {}) {
    const errors = [];
    if (!object(handoff)) errors.push("Handoff must be an object.");
    if (handoff?.handoffVersion !== "1.0") errors.push("Unsupported handoffVersion.");
    if (!UUID.test(handoff?.handoffId ?? "")) errors.push("Invalid handoffId.");
    if (!UUID.test(handoff?.planId ?? "")) errors.push("Invalid planId.");
    if (handoff?.stepId !== "backend") errors.push("Protocol 100 requires the BACKEND step.");
    if (handoff?.protocol?.id !== "100" || handoff?.protocol?.version !== "1.0") errors.push("Protocol must be 100 version 1.0.");
    if (!object(handoff?.request)) errors.push("Handoff request must be an object.");
    if (!object(handoff?.inputs)) errors.push("Handoff inputs must be an object.");
    if (handoff?.target !== null) errors.push("Protocol 100 target must be null.");
    if (!Array.isArray(handoff?.completedDependencies) || handoff.completedDependencies.length) errors.push("BACKEND completedDependencies must be empty.");
    if (Number.isNaN(Date.parse(handoff?.requestedAt ?? ""))) errors.push("requestedAt must be an ISO date-time.");
    if (containsCredential(handoff)) errors.push("Credential-like content is not allowed.");

    const inputs = handoff?.inputs ?? {};
    const project = inputs.project ?? {};
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(project.name ?? "")) errors.push("Invalid project name.");
    if (!/^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z_][A-Za-z0-9_]*)*$/.test(project.namespace ?? "")) errors.push("Invalid project namespace.");
    if (project.runtime !== "NODEJS") errors.push("Only NODEJS runtime is supported.");
    if (!new Set(["SQLITE", "HANA"]).has(project.persistence)) errors.push("CAP persistence is required. Choose SQLITE or HANA explicitly.");
    if (project.odataVersion !== "V4") errors.push("Only OData V4 is supported.");
    if (typeof project.outputParent !== "string" || !project.outputParent.trim() || path.isAbsolute(project.outputParent)) errors.push("outputParent must be a workspace-relative path.");

    const requirements = inputs.requirements;
    if (!Array.isArray(requirements) || requirements.length === 0) errors.push("At least one requirement is required.");
    const requirementIds = new Set();
    for (const requirement of requirements ?? []) {
        if (!REQUIREMENT_ID.test(requirement?.id ?? "") || requirementIds.has(requirement.id)) errors.push("Requirement IDs must be valid and unique.");
        requirementIds.add(requirement?.id);
        if (!String(requirement?.text ?? "").trim()) errors.push(`Requirement ${requirement?.id ?? "unknown"} has no text.`);
    }
    if (!Array.isArray(inputs.domain?.entities) || inputs.domain.entities.length === 0 || inputs.domain.entities.length > 50) errors.push("Domain must contain 1 to 50 entities.");
    if (!Array.isArray(inputs.services) || inputs.services.length === 0 || inputs.services.length > 10) errors.push("Request must contain 1 to 10 services.");

    let outputDirectory = null;
    let outputBoundaryPassed = false;
    if (typeof project.outputParent === "string" && project.name) {
        outputDirectory = path.resolve(workspaceRoot, project.outputParent, project.name);
        try { assertOutputInsideWorkspace(outputDirectory, path.resolve(workspaceRoot)); outputBoundaryPassed = true; }
        catch (error) { errors.push(error.message); }
    }
    return { passed: errors.length === 0, errors: [...new Set(errors)], outputDirectory, outputBoundaryPassed, requirementIds };
}

export function assertRequirementRefs(items, requirementIds, label) {
    const errors = [];
    for (const item of items ?? []) {
        if (!Array.isArray(item?.requirementIds) || item.requirementIds.length === 0) errors.push(`${label} requires requirementIds.`);
        for (const id of item?.requirementIds ?? []) if (!requirementIds.has(id)) errors.push(`${label} references unknown requirement ${id}.`);
    }
    return errors;
}

export { IDENTIFIER };
