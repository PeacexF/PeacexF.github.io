import { getCollection } from "astro:content";
import { extractDocMeta } from "./doc_meta";
import { projectMeta, type ProjectStatus } from "../data/projects";

export interface GraphNode {
  id: string;
  label: string;
  href: string;
  section: string;
  kind: "root" | "index" | "page";
  depth: number;
  words: number;
  oneLiner: string;
  status?: ProjectStatus;
  x: number;
  y: number;
  z: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  kind: "tree" | "link";
}

export interface SiteGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

const ROUTES: Record<string, string> = {
  projects: "/development/projects",
  devops: "/development/devops",
  infrastructure: "/development/infrastructure",
  about: "/about",
  services: "/services",
  osint: "/osint",
};

const SOURCE_DIRS: Record<string, string> = {
  projects: "development/projects",
  devops: "development/devops",
  infrastructure: "development/infrastructure",
  about: "about",
  services: "services",
  osint: "osint",
};

// Real index routes with no collection entry.
const STANDALONE_INDEXES: Array<{ href: string; label: string }> = [
  { href: "/development", label: "development" },
  { href: "/osint/cases", label: "cases" },
];

const slugOf = (id: string) => id.replace(/\.md$/, "");

// Mirrors rehypeStripMdLinks. A README target collapses to its directory.
function resolveLink(fromDir: string, href: string): string | null {
  if (/^(https?:|mailto:|tel:|#)/.test(href)) return null;

  const withoutHash = href.split("#")[0];
  if (!withoutHash) return null;
  if (!withoutHash.endsWith(".md")) return null;

  const target = withoutHash.replace(/\.md$/, "");
  const base = withoutHash.startsWith("/") ? "" : fromDir;
  const segments = `${base}/${target}`.split("/");

  const out: string[] = [];
  for (const seg of segments) {
    if (!seg || seg === ".") continue;
    if (seg === "..") out.pop();
    else out.push(seg);
  }

  if (out[out.length - 1] === "README") out.pop();
  return `/${out.join("/")}`;
}

function countWords(body: string): number {
  return body.split(/\s+/).filter(Boolean).length;
}

function ancestors(href: string): string[] {
  const parts = href.split("/").filter(Boolean);
  const out: string[] = [];
  for (let i = parts.length - 1; i >= 1; i--) {
    out.push(`/${parts.slice(0, i).join("/")}`);
  }
  return out;
}

export async function buildSiteGraph(): Promise<SiteGraph> {
  const nodes = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];
  const sourceDirOf = new Map<string, string>();
  const bodies = new Map<string, string>();

  const blank = (href: string, label: string, kind: GraphNode["kind"]): GraphNode => ({
    id: href,
    label,
    href,
    section: href.split("/").filter(Boolean)[0] ?? "root",
    kind,
    depth: href === "/" ? 0 : href.split("/").filter(Boolean).length,
    words: 0,
    oneLiner: "",
    x: 0,
    y: 0,
    z: 0,
  });

  nodes.set("/", { ...blank("/", "peace", "root"), section: "root" });

  for (const [collection, route] of Object.entries(ROUTES)) {
    const entries = await getCollection(collection as never);
    for (const entry of entries as Array<{ id: string; body?: string }>) {
      const slug = slugOf(entry.id);
      const href = `${route}/${slug}`;
      const body = entry.body ?? "";
      const meta = extractDocMeta(body);

      const node = blank(href, meta.title, "page");
      node.words = countWords(body);
      node.oneLiner = meta.oneLiner;

      // Curated metadata wins over the derived heading.
      if (collection === "projects") {
        const curated = projectMeta[slug];
        if (curated) {
          node.label = curated.title;
          node.oneLiner = curated.oneLiner;
          node.status = curated.status;
        }
      }

      nodes.set(href, node);
      bodies.set(href, body);
      const dir = slug.includes("/") ? `/${slug.split("/").slice(0, -1).join("/")}` : "";
      sourceDirOf.set(href, `${SOURCE_DIRS[collection]}${dir}`);
    }
  }

  for (const { href, label } of STANDALONE_INDEXES) {
    if (!nodes.has(href)) nodes.set(href, blank(href, label, "index"));
  }

  for (const href of [...nodes.keys()]) {
    if (href === "/") continue;
    for (const parent of ancestors(href)) {
      if (!nodes.has(parent)) {
        nodes.set(parent, blank(parent, parent.split("/").filter(Boolean).pop()!, "index"));
      }
    }
  }

  for (const node of nodes.values()) {
    if (node.href === "/") continue;
    const parent = ancestors(node.href)[0] ?? "/";
    edges.push({ source: parent, target: node.href, kind: "tree" });
  }

  const seen = new Set<string>();
  for (const [href, body] of bodies) {
    const dir = sourceDirOf.get(href);
    if (dir === undefined) continue;

    for (const match of body.matchAll(/\]\(([^)\s]+)\)/g)) {
      const target = resolveLink(dir, match[1]);
      if (!target || target === href || !nodes.has(target)) continue;

      const key = `${href}->${target}`;
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push({ source: href, target, kind: "link" });
    }
  }

  // Sorted so the seeded layout is reproducible.
  const ordered = [...nodes.values()].sort((a, b) => a.id.localeCompare(b.id));
  layout(ordered, edges);

  return { nodes: ordered, edges };
}

function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Baked at build time so the client ships no physics. O(n²) is fine at ~50 nodes.
function layout(nodes: GraphNode[], edges: GraphEdge[]): void {
  const ITERATIONS = 400;
  const REPULSION = 1.2;
  const SPRING = 0.08;
  const CENTERING = 0.012;
  const MAX_STEP = 0.35;

  const rng = mulberry32(0x5eed);
  const index = new Map(nodes.map((n, i) => [n.id, i]));

  // Sphere, not cube: cube corners cost most of the repulsion budget to unpack.
  for (const node of nodes) {
    const theta = rng() * Math.PI * 2;
    const phi = Math.acos(2 * rng() - 1);
    const r = 6 + rng() * 2;
    node.x = r * Math.sin(phi) * Math.cos(theta);
    node.y = r * Math.sin(phi) * Math.sin(theta);
    node.z = r * Math.cos(phi);
  }

  const restLength = (a: GraphNode, b: GraphNode) =>
    a.kind === "root" || b.kind === "root" ? 4.5 : 2.6;

  const vx = new Float64Array(nodes.length);
  const vy = new Float64Array(nodes.length);
  const vz = new Float64Array(nodes.length);

  for (let iter = 0; iter < ITERATIONS; iter++) {
    const alpha = 1 - iter / ITERATIONS;
    vx.fill(0);
    vy.fill(0);
    vz.fill(0);

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        let dx = nodes[i].x - nodes[j].x;
        let dy = nodes[i].y - nodes[j].y;
        let dz = nodes[i].z - nodes[j].z;
        let d2 = dx * dx + dy * dy + dz * dz;
        if (d2 < 0.01) {
          // No direction to separate along.
          dx = (rng() - 0.5) * 0.1;
          dy = (rng() - 0.5) * 0.1;
          dz = (rng() - 0.5) * 0.1;
          d2 = 0.01;
        }
        const d = Math.sqrt(d2);
        const f = REPULSION / d2;
        const ux = (dx / d) * f;
        const uy = (dy / d) * f;
        const uz = (dz / d) * f;
        vx[i] += ux; vy[i] += uy; vz[i] += uz;
        vx[j] -= ux; vy[j] -= uy; vz[j] -= uz;
      }
    }

    for (const edge of edges) {
      const a = index.get(edge.source);
      const b = index.get(edge.target);
      if (a === undefined || b === undefined) continue;

      const dx = nodes[b].x - nodes[a].x;
      const dy = nodes[b].y - nodes[a].y;
      const dz = nodes[b].z - nodes[a].z;
      const d = Math.hypot(dx, dy, dz) || 0.01;
      // Weaker than containment, or cross-links fold the tree.
      const strength = SPRING * (edge.kind === "tree" ? 1 : 0.25);
      const f = (d - restLength(nodes[a], nodes[b])) * strength;
      const ux = (dx / d) * f;
      const uy = (dy / d) * f;
      const uz = (dz / d) * f;
      vx[a] += ux; vy[a] += uy; vz[a] += uz;
      vx[b] -= ux; vy[b] -= uy; vz[b] -= uz;
    }

    for (let i = 0; i < nodes.length; i++) {
      vx[i] -= nodes[i].x * CENTERING;
      vy[i] -= nodes[i].y * CENTERING;
      vz[i] -= nodes[i].z * CENTERING;

      const step = Math.hypot(vx[i], vy[i], vz[i]);
      const scale = step > MAX_STEP ? MAX_STEP / step : 1;
      nodes[i].x += vx[i] * scale * alpha;
      nodes[i].y += vy[i] * scale * alpha;
      nodes[i].z += vz[i] * scale * alpha;
    }
  }

  normalise(nodes);
}

function normalise(nodes: GraphNode[]): void {
  let cx = 0, cy = 0, cz = 0;
  for (const n of nodes) { cx += n.x; cy += n.y; cz += n.z; }
  cx /= nodes.length; cy /= nodes.length; cz /= nodes.length;

  let max = 0;
  for (const n of nodes) {
    n.x -= cx; n.y -= cy; n.z -= cz;
    max = Math.max(max, Math.hypot(n.x, n.y, n.z));
  }

  const scale = max > 0 ? 1 / max : 1;
  for (const n of nodes) {
    n.x = round(n.x * scale);
    n.y = round(n.y * scale);
    n.z = round(n.z * scale);
  }
}

// Sub-pixel at any camera distance, and ~a third off the serialised size.
const round = (v: number) => Math.round(v * 10000) / 10000;
