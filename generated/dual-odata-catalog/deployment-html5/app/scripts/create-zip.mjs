import { promises as fs } from "node:fs";
import path from "node:path";

const root = path.resolve("dist");
const archivePath = path.join(root, "dual-odata-catalog.zip");

function crc32(buffer) {
    let crc = 0xffffffff;
    for (const byte of buffer) {
        crc ^= byte;
        for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
    return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime() {
    return { date: (1 << 5) | 1, time: 0 };
}

async function collectFiles(directory, prefix = "") {
    const entries = (await fs.readdir(directory, { withFileTypes: true }))
        .filter((entry) => entry.name !== "dual-odata-catalog.zip")
        .sort((a, b) => a.name.localeCompare(b.name));
    const files = [];
    for (const entry of entries) {
        const fullPath = path.join(directory, entry.name);
        const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
        if (entry.isDirectory()) files.push(...await collectFiles(fullPath, relativePath));
        else if (entry.isFile()) files.push({ fullPath, relativePath });
    }
    return files;
}

const files = await collectFiles(root);
const localRecords = [];
const centralRecords = [];
let offset = 0;
const { date, time } = dosDateTime();

for (const file of files) {
    const data = await fs.readFile(file.fullPath);
    const name = Buffer.from(file.relativePath.replaceAll(path.sep, "/"), "utf8");
    const checksum = crc32(data);
    const local = Buffer.alloc(30 + name.length);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x800, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(date, 12);
    local.writeUInt32LE(checksum, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    name.copy(local, 30);
    localRecords.push(Buffer.concat([local, data]));

    const central = Buffer.alloc(46 + name.length);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x800, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(time, 12);
    central.writeUInt16LE(date, 14);
    central.writeUInt32LE(checksum, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(name.length, 28);
    name.copy(central, 46);
    central.writeUInt32LE(offset, 42);
    centralRecords.push(central);
    offset += local.length + data.length;
}

const centralDirectory = Buffer.concat(centralRecords);
const end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50, 0);
end.writeUInt16LE(0, 8);
end.writeUInt16LE(0, 10);
end.writeUInt16LE(files.length, 8);
end.writeUInt16LE(files.length, 10);
end.writeUInt32LE(centralDirectory.length, 12);
end.writeUInt32LE(offset, 16);

await fs.writeFile(archivePath, Buffer.concat([...localRecords, centralDirectory, end]));
console.log(`Created ${archivePath} (${files.length} files)`);
