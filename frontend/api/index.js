export const config = {
  runtime: "nodejs",
};

// Wrap the server handler with logging and a timeout so we can detect
// where requests are stalling in production (cold-start, import, or fetch).
export default async function handler(request, context) {
  const start = Date.now();
  console.log("[api] handler start", { url: request.url });

  // TSS_SHELL=true tells TanStack Start to return only the HTML shell
  // (doctype, head with assets/meta, and <Scripts /> placeholder) without
  // running Clerk auth, route data fetching, or full SSR — the client hydrates.
  // This eliminates the 30s+ timeout from the full SSR pipeline when honored.
  const env = { ...process.env, TSS_SHELL: "true" };

  // Lazy-import the server bundle so we can log before module initialization
  // and detect cold-start time separately from request handling time.
  let server;
  try {
    console.log("[api] importing server bundle");
    // eslint-disable-next-line node/no-unsupported-features/es-syntax
    server = (await import("../dist/server/server.js")).default;
    console.log("[api] server bundle imported", { importMs: Date.now() - start });
  } catch (err) {
    console.error("[api] failed to import server bundle", err);
    return new Response("Server initialization error", { status: 500 });
  }

  // Allow overriding the timeout using `FUNCTION_TIMEOUT_MS` env var for testing.
  const timeoutMs = Number(process.env.FUNCTION_TIMEOUT_MS) || 10000;

  try {
    const fetchPromise = server.fetch(request, env, context);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("handler timed out")), timeoutMs),
    );

    const response = await Promise.race([fetchPromise, timeoutPromise]);
    console.log("[api] handler finished", { totalMs: Date.now() - start });
    return response;
  } catch (err) {
    console.error("[api] handler error", err);
    // If the handler timed out, return 504 to surface the issue in logs and client.
    if (String(err?.message).includes("timed out")) {
      return new Response("Gateway timeout", { status: 504 });
    }
    return new Response("Service unavailable", { status: 503 });
  }
}
