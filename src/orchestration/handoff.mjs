import { generateStandardProject } from "../generation/standard/generator.mjs";
import { generateCustomProject } from "../generation/custom/generator.mjs";
import { generateFreestyleProject } from "../generation/freestyle/generator.mjs";

const generators = Object.freeze({ STANDARD: generateStandardProject, CUSTOM: generateCustomProject, FREESTYLE: generateFreestyleProject });

export async function handoffToSingleGenerator(context) {
    const generator = generators[context.assessment.selectedType];
    if (!generator) throw new Error(`No generator is registered for ${context.assessment.selectedType}.`);
    return generator(context);
}

export function getGeneratorRegistry() {
    return Object.keys(generators);
}
