import { runGeneration } from "../../orchestration/generate.mjs";

export function generateStandard(options) {
    return runGeneration({ ...options, type: "standard" });
}
