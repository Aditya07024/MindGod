import { handle } from "@hono/node-server/vercel";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import app from "./dist/server/server.js";

const server = new Hono();

// Serve static assets from the client build
server.use("/assets/*", serveStatic({ root: "./dist/client" }));

// Forward all other requests to the TanStack Start fetch handler
server.all("*", async (c) => {
  return app.fetch(c.req.raw, process.env, {});
});

// Export the handler for Vercel
export default handle(server);
