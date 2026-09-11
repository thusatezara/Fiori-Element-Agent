import { runGeneration } from "../../orchestration/generate.mjs";

export function generateFreestyle(options) {
    return runGeneration({ ...options, type: "freestyle" });
}
