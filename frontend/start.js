import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import app from "./dist/server/server.js";

const server = new Hono();

// Serve static assets from the client build
server.use("/*", serveStatic({ root: "./dist/client" }));

// Forward all other requests to the TanStack Start fetch handler
server.all("*", async (c) => {
  return app.fetch(c.req.raw, process.env, {});
});

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

serve(
  {
    fetch: server.fetch,
    port,
  },
  (info) => {
    console.log(`Node server listening on http://localhost:${info.port}`);
  }
);
