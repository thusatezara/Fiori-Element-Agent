#!/usr/bin/env node

import { parseArgs } from "./index.mjs";
import { createSolutionPlan } from "../orchestration/solution-plan.mjs";
import { normalizeSolutionRequest } from "../orchestration/solution-request.mjs";
import { pathToFileURL } from "node:url";

export function printPlanHelp() {
    console.log(`BTP Solution Agent

Usage:
  npm run plan -- --request "Create a CAP backend and Fiori application"

Target options:
  --db <SQLITE|HANA>  CAP persistence; required when the request includes a CAP Backend
  --cf-api <https-url> --cf-org <name> --cf-space <name> --stage <DEV|TEST|PROD>
  --work-zone-edition <STANDARD|ADVANCED>
  --work-zone-subaccount <id> --work-zone-site <id> --work-zone-content-target <id>
`);
}

export async function main(argv = process.argv.slice(2)) {
    const options = parseArgs(argv);
    if (options.help) {
        printPlanHelp();
        return null;
    }
    const request = normalizeSolutionRequest({
        request: options.request,
        backend: { persistence: options.db },
        cloudFoundry: {
            api: options.cf_api,
            org: options.cf_org,
            space: options.cf_space,
            stage: options.stage
        },
        workZone: {
            edition: options.work_zone_edition,
            subaccount: options.work_zone_subaccount,
            site: options.work_zone_site,
            contentTarget: options.work_zone_content_target
        }
    });
    const plan = createSolutionPlan(request);
    console.log(JSON.stringify(plan, null, 2));
    return plan;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    try {
        await main();
    } catch (error) {
        console.error(`Planning failed: ${error.message}`);
        process.exitCode = 1;
    }
}
