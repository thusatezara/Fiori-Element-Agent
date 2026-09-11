#!/usr/bin/env node

import { main } from "./index.mjs";

try {
    await main();
} catch (error) {
    console.error(`Generation failed: ${error.message}`);
    process.exitCode = 1;
}
