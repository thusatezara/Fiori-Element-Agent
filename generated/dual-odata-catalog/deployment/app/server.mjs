import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "webapp");
const contentTypes = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8", ".xml": "application/xml; charset=utf-8", ".css": "text/css; charset=utf-8", ".properties": "text/plain; charset=utf-8", ".png": "image/png", ".svg": "image/svg+xml" };
const proxies = [{ prefix: "/admin/", base: "https://cc779debtrial-dev-bookshop-srv.cfapps.us10-001.hana.ondemand.com/admin/" }, { prefix: "/northwind/", base: "https://services.odata.org/northwind/" }];

async function proxy(req, res, match) {
  const target = new URL(req.url.slice(match.prefix.length), match.base);
  const response = await fetch(target, { method: req.method, headers: { accept: req.headers.accept || "application/json" } });
  res.statusCode = response.status;
  for (const [name, value] of response.headers) if (!["connection", "content-length", "content-encoding", "transfer-encoding"].includes(name.toLowerCase())) res.setHeader(name, value);
  res.end(Buffer.from(await response.arrayBuffer()));
}

async function serve(req, res) {
  try {
    const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    const match = proxies.find(({ prefix }) => pathname.startsWith(prefix));
    if (match) return await proxy(req, res, match);
    const requested = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
    let file = path.resolve(root, requested);
    if (!file.startsWith(root + path.sep)) throw new Error("Invalid path");
    try { if (!(await stat(file)).isFile()) file = path.join(root, "index.html"); }
    catch { file = path.join(root, "index.html"); }
    res.setHeader("content-type", contentTypes[path.extname(file)] || "application/octet-stream");
    res.end(await readFile(file));
  } catch (error) {
    res.statusCode = 502;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ error: "Request failed", message: error.message }));
  }
}

createServer(serve).listen(Number(process.env.PORT || 3000));
