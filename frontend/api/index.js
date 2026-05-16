let app;

async function getApp() {
  if (!app) {
    const mod = await import("../dist/server/server.js");
    app = mod.default || mod;
  }
  return app;
}

export default async function handler(req, res) {
  try {
    const server = await getApp();

    // Build the full URL
    const protocol = req.headers["x-forwarded-proto"] || "https";
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    const url = new URL(req.url, `${protocol}://${host}`);

    // Convert Node.js headers to fetch Headers
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

    // Read body for non-GET/HEAD requests
    let body = null;
    if (req.method !== "GET" && req.method !== "HEAD") {
      body = await new Promise((resolve) => {
        const chunks = [];
        req.on("data", (chunk) => chunks.push(chunk));
        req.on("end", () => resolve(Buffer.concat(chunks)));
      });
    }

    // Create a standard fetch Request
    const fetchRequest = new Request(url.toString(), {
      method: req.method,
      headers,
      body,
    });

    // Call the TanStack Start server's fetch handler
    const response = await server.fetch(fetchRequest, process.env, {});

    // Convert fetch Response back to Node.js res
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
