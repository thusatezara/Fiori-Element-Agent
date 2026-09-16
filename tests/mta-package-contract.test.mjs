import assert from "node:assert/strict";
import test from "node:test";
import { validateCompositionRequest } from "../src/composition/mta/contract.mjs";
import { detectCollisions } from "../src/composition/mta/collision-detector.mjs";

test("200 rejects credential-like request data", () => {
    const result = validateCompositionRequest({ token: "do-not-store" });
    assert.equal(result.passed, false);
    assert.match(result.errors.join(" "), /credential/i);
});

test("200 detects duplicate and unresolved topology references", () => {
    const errors = detectCollisions({
        modules: [{ name: "app", requires: [{ name: "missing" }] }, { name: "app" }],
        resources: []
    });
    assert.match(errors.join(" "), /Duplicate module|collision/);
    assert.match(errors.join(" "), /Unknown resource/);
});

