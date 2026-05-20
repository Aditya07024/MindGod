import { readFileSync, existsSync } from "node:fs";
import { join, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CLIENT_DIR = join(__dirname, "..", "dist", "client");

const MIME_TYPES = {
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".css": "text/css",
  ".html": "text/html",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".json": "application/json",
  ".txt": "text/plain",
};

let app;

async function getApp() {
  if (!app) {
    const serverPath = join(__dirname, "..", "dist", "server", "server.js");
    console.log("Loading server from:", serverPath);
    console.log("Server exists:", existsSync(serverPath));
    const { pathToFileURL } = await import("node:url");
    const mod = await import(pathToFileURL(serverPath).href);
    app = mod.default || mod;
  }
  return app;
}

export default async function handler(req, res) {
  try {
    // Try to serve static files from dist/client
    const url = new URL(req.url, "http://localhost");
    const staticPath = join(CLIENT_DIR, url.pathname);

    // Security: ensure the resolved path is within CLIENT_DIR
    if (staticPath.startsWith(CLIENT_DIR) && existsSync(staticPath) && !staticPath.endsWith("/")) {
      const ext = extname(staticPath);
      const mime = MIME_TYPES[ext] || "application/octet-stream";
      const content = readFileSync(staticPath);
      res.setHeader("Content-Type", mime);
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      return res.end(content);
    }

    // Otherwise, handle SSR via TanStack Start
    const server = await getApp();

    const protocol = req.headers["x-forwarded-proto"] || "https";
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    const fullUrl = new URL(req.url, `${protocol}://${host}`);

    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value) {
        if (Array.isArray(value)) {
          value.forEach((v) => headers.append(key, v));
        } else {
          headers.set(key, value);
        }
      }
    }

    let body = null;
    if (req.method !== "GET" && req.method !== "HEAD") {
      body = await new Promise((resolve) => {
        const chunks = [];
        req.on("data", (chunk) => chunks.push(chunk));
        req.on("end", () => resolve(Buffer.concat(chunks)));
      });
    }

    const fetchRequest = new Request(fullUrl.toString(), {
      method: req.method,
      headers,
      body,
    });

    const response = await server.fetch(fetchRequest, process.env, {});

    const responseHeaders = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });
    res.writeHead(response.status, responseHeaders);

    const responseBody = await response.arrayBuffer();
    res.end(Buffer.from(responseBody));
  } catch (error) {
    console.error("Vercel handler error:", error);
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Internal Server Error: " + error.message);
  }
}
