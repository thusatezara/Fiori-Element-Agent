import assert from "node:assert/strict";
import test from "node:test";
import { validateCapHandoff } from "../src/generation/backend/cap/request-validator.mjs";
import { createDomainPlan } from "../src/generation/backend/cap/domain-plan.mjs";
import { createServicePlan } from "../src/generation/backend/cap/service-plan.mjs";
import { loadCapFixture, loadCapSchemas, clone } from "./helpers/cap-contract.mjs";

test("CAP contract schemas load and a valid 100 handoff plans deterministically", async () => {
    const schemas = await loadCapSchemas();
    assert.equal(schemas.length, 3);
    const handoff = await loadCapFixture("cap-crud-01");
    const validation = validateCapHandoff(handoff);
    assert.equal(validation.passed, true, validation.errors.join("; "));
    const domain = createDomainPlan(handoff.inputs.domain, validation.requirementIds);
    assert.equal(domain.passed, true, domain.errors.join("; "));
    assert.equal(createServicePlan(handoff.inputs.services, domain, validation.requirementIds).passed, true);
});

test("CAP contract blocks invalid protocol, runtime, missing key and unresolved relationship", async () => {
    const source = await loadCapFixture("cap-crud-01");
    const wrongProtocol = clone(source); wrongProtocol.protocol.id = "999";
    assert.equal(validateCapHandoff(wrongProtocol).passed, false);
    const wrongRuntime = clone(source); wrongRuntime.inputs.project.runtime = "JAVA";
    assert.equal(validateCapHandoff(wrongRuntime).passed, false);
    const missingPersistence = clone(source); delete missingPersistence.inputs.project.persistence;
    const missingPersistenceValidation = validateCapHandoff(missingPersistence);
    assert.equal(missingPersistenceValidation.passed, false);
    assert.match(missingPersistenceValidation.errors.join(" "), /persistence.*required/i);
    const missingKey = clone(source); missingKey.inputs.domain.entities[0].elements[0].key = false;
    const validation = validateCapHandoff(missingKey);
    assert.match(createDomainPlan(missingKey.inputs.domain, validation.requirementIds).errors.join(" "), /key/i);
    const unresolved = clone(source); unresolved.inputs.domain.entities[1].relationships[0].targetEntityId = "missing";
    assert.match(createDomainPlan(unresolved.inputs.domain, validateCapHandoff(unresolved).requirementIds).errors.join(" "), /unresolved/i);
});

test("CAP service projection accepts fields supplied by the managed aspect", async () => {
    const handoff = clone(await loadCapFixture("cap-crud-01"));
    handoff.inputs.services[0].entities[0].exposedElements.push("createdAt", "createdBy", "modifiedAt", "modifiedBy");
    const validation = validateCapHandoff(handoff);
    const domain = createDomainPlan(handoff.inputs.domain, validation.requirementIds);
    const service = createServicePlan(handoff.inputs.services, domain, validation.requirementIds);
    assert.equal(service.passed, true, service.errors.join("; "));
});
