import assert from "node:assert/strict";
import test from "node:test";
import { createCfProcessAdapter, redactOutput } from "../src/deployment/cloud-foundry/cf-process-adapter.mjs";
import { canonicalizeTarget, targetFingerprint } from "../src/deployment/cloud-foundry/target-inspector.mjs";

test("300 canonical target fingerprint is stable", () => {
    const a = { api: "https://api.cf.example.test/", org: " demo ", space: "dev", stage: "DEV" };
    const b = { api: "https://api.cf.example.test", org: "demo", space: "dev", stage: "DEV" };
    assert.deepEqual(canonicalizeTarget(a), canonicalizeTarget(b));
    assert.equal(targetFingerprint(a), targetFingerprint(b));
});

test("300 redacts output and rejects commands outside the allowlist", async () => {
    assert.doesNotMatch(redactOutput("token=do-not-store"), /do-not-store/);
    await assert.rejects(() => createCfProcessAdapter().run(["login"]), /allowlisted/);
});

