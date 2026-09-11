import { runGeneration } from "../../orchestration/generate.mjs";

export function generateCustom(options) {
    return runGeneration({ ...options, type: "custom" });
}
