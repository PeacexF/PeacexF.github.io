// Flat projection of the baked graph

import type { GraphNode, SiteGraph } from "./site_graph";
import { cssValue, deservesLabel, EDGE_TOKEN, isStructural, nodeRadius, tokenFor } from "./graph_theme";

export interface SvgOptions {
  width?: number;
  height?: number;
  yaw?: number;
  pitch?: number;
  distance?: number;
  labels?: boolean;
}

const colorFor = (n: GraphNode) => cssValue(tokenFor(n.section));

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

interface Projected {
  node: GraphNode;
  sx: number;
  sy: number;
  depth: number;
  r: number;
}

export function graphToSvg(graph: SiteGraph, opts: SvgOptions = {}): string {
  const {
    width = 900,
    height = 700,
    yaw = 0.6,
    pitch = 0.32,
    distance = 3.2,
    labels = true,
  } = opts;

  const cosY = Math.cos(yaw), sinY = Math.sin(yaw);
  const cosP = Math.cos(pitch), sinP = Math.sin(pitch);

  const project = (n: GraphNode): Projected => {
    const x1 = n.x * cosY + n.z * sinY;
    const z1 = -n.x * sinY + n.z * cosY;
    const y2 = n.y * cosP - z1 * sinP;
    const z2 = n.y * sinP + z1 * cosP;

    const scale = distance / (distance - z2);
    return { node: n, sx: x1 * scale, sy: -y2 * scale, depth: z2, r: nodeRadius(n) * scale };
  };

  const points = new Map<string, Projected>();
  for (const n of graph.nodes) points.set(n.id, project(n));

  // Extent in layout units only. Radii are pixels, so folding them in here
  // inflates the span and shrinks the whole drawing.
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  let maxR = 0;
  for (const p of points.values()) {
    minX = Math.min(minX, p.sx); maxX = Math.max(maxX, p.sx);
    minY = Math.min(minY, p.sy); maxY = Math.max(maxY, p.sy);
    maxR = Math.max(maxR, p.r);
  }
  const pad = (labels ? 34 : 8) + maxR;
  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;
  const k = Math.min((width - pad * 2) / spanX, (height - pad * 2) / spanY);
  const ox = (width - spanX * k) / 2 - minX * k;
  const oy = (height - spanY * k) / 2 - minY * k;

  const X = (p: Projected) => +(p.sx * k + ox).toFixed(1);
  const Y = (p: Projected) => +(p.sy * k + oy).toFixed(1);

  const drawOrder = [...points.values()].sort((a, b) => a.depth - b.depth);
  const depths = drawOrder.map((p) => p.depth);
  const dMin = Math.min(...depths), dMax = Math.max(...depths);
  const fade = (d: number) => +(0.45 + 0.55 * ((d - dMin) / (dMax - dMin || 1))).toFixed(2);

  const out: string[] = [];
  out.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" ` +
      `width="${width}" height="${height}" role="img" ` +
      `aria-label="Map of this site: ${graph.nodes.length} pages, connected by section and by cross-reference.">`,
  );

  out.push(`<g fill="none" stroke-linecap="round">`);
  for (const e of graph.edges) {
    const a = points.get(e.source);
    const b = points.get(e.target);
    if (!a || !b) continue;
    const near = Math.max(a.depth, b.depth);
    const tree = e.kind === "tree";
    out.push(
      `<line x1="${X(a)}" y1="${Y(a)}" x2="${X(b)}" y2="${Y(b)}" ` +
        `stroke="${cssValue(EDGE_TOKEN)}" ` +
        `stroke-width="${tree ? 1.1 : 0.8}" ` +
        `opacity="${(fade(near) * (tree ? 0.9 : 0.5)).toFixed(2)}"` +
        `${tree ? "" : ` stroke-dasharray="3 3"`} />`,
    );
  }
  out.push(`</g>`);

  for (const p of drawOrder) {
    out.push(
      `<circle cx="${X(p)}" cy="${Y(p)}" r="${p.r.toFixed(1)}" ` +
        `fill="${colorFor(p.node)}" opacity="${fade(p.depth)}" />`,
    );
  }

  if (labels) {
    out.push(
      `<g font-family="var(--font-mono, ui-monospace, monospace)" ` +
        `fill="var(--color-ink, #12161d)" text-anchor="middle">`,
    );
    // Nearest first, and drop any label that would collide with one already
    // placed — labelling all 50 is an unreadable mat of overlapping text.
    const placed: Array<[number, number, number, number]> = [];
    for (const p of [...drawOrder].reverse()) {
      if (!deservesLabel(p.node)) continue;
      const structural = isStructural(p.node);

      const size = structural ? 12 : 10;
      const cx = X(p);
      const cy = Y(p) - p.r - 5;
      const w = p.node.label.length * size * 0.6;
      const box: [number, number, number, number] = [cx - w / 2, cy - size, cx + w / 2, cy + 3];

      if (placed.some((q) => box[0] < q[2] && box[2] > q[0] && box[1] < q[3] && box[3] > q[1])) {
        continue;
      }
      placed.push(box);

      out.push(
        `<text x="${cx}" y="${cy.toFixed(1)}" font-size="${size}" ` +
          `opacity="${Math.min(1, fade(p.depth) + 0.2).toFixed(2)}"` +
          `${structural ? ` font-weight="600"` : ""}>${esc(p.node.label)}</text>`,
      );
    }
    out.push(`</g>`);
  }

  out.push(`</svg>`);
  return out.join("\n");
}
