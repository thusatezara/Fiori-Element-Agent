import { mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export function createMtaWorkspace() {
    return mkdtemp(path.join(os.tmpdir(), "fiori-agent-mta-"));
}

