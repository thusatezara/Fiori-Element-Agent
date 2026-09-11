import { access, mkdir, rename, rm, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join, relative } from "node:path";

export function assertOutputInsideWorkspace(outputDirectory, workspaceRoot) {
    const relativePath = relative(workspaceRoot, outputDirectory);
    if (isAbsolute(relativePath) || relativePath === ".." || relativePath.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`)) {
        throw new Error("Output directory must remain inside the repository workspace.");
    }
}

export async function assertOutputDoesNotExist(directory) {
    try {
        await access(directory);
        throw new Error(`Output directory already exists: ${directory}. Choose a new --output path.`);
    } catch (error) {
        if (error.code !== "ENOENT") {
            throw error;
        }
    }
}

export async function writeApplicationAtomically(outputDirectory, files) {
    const parent = dirname(outputDirectory);
    await mkdir(parent, { recursive: true });
    const temporaryDirectory = `${outputDirectory}.tmp-${process.pid}-${Date.now()}`;
    await mkdir(temporaryDirectory, { recursive: true });
    try {
        for (const [filePath, contents] of files) {
            const target = join(temporaryDirectory, filePath);
            await mkdir(dirname(target), { recursive: true });
            await writeFile(target, contents, "utf8");
        }
        await renameWithRetry(temporaryDirectory, outputDirectory);
    } catch (error) {
        await rm(temporaryDirectory, { recursive: true, force: true });
        throw error;
    }
}

async function renameWithRetry(source, destination) {
    for (let attempt = 0; attempt < 4; attempt += 1) {
        try {
            await rename(source, destination);
            return;
        } catch (error) {
            if (process.platform !== "win32" || !["EPERM", "EACCES", "EBUSY"].includes(error.code) || attempt === 3) throw error;
            await new Promise((resolve) => setTimeout(resolve, 50 * (attempt + 1)));
        }
    }
}
