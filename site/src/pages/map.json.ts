// The content graph as data

import type { APIRoute } from "astro";
import { buildSiteGraph } from "../lib/site_graph";

export const GET: APIRoute = async () => {
  const graph = await buildSiteGraph();
  return new Response(JSON.stringify(graph), {
    headers: { "content-type": "application/json; charset=utf-8" },
  });
};
