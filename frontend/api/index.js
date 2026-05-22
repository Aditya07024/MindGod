import server from '../dist/server/server.js';

export const config = {
  runtime: 'nodejs',
};

export default async function handler(request, context) {
  // TSS_SHELL=true tells TanStack Start to return only the HTML shell
  // (doctype, head with assets/meta, and <Scripts /> placeholder) without
  // running Clerk auth, route data fetching, or full SSR — the client hydrates.
  // This eliminates the 30s+ timeout from the full SSR pipeline.
  const env = { ...process.env, TSS_SHELL: 'true' };
  return server.fetch(request, env, context);
}
