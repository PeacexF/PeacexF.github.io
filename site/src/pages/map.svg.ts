import type { APIRoute } from "astro";
import { buildSiteGraph } from "../lib/site_graph";
import { graphToSvg } from "../lib/graph_svg";

export const GET: APIRoute = async () => {
  const graph = await buildSiteGraph();
  return new Response(graphToSvg(graph), {
    headers: { "content-type": "image/svg+xml; charset=utf-8" },
  });
};
