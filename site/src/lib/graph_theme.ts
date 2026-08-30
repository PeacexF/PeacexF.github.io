import type { GraphNode } from "./site_graph";

// Type-only import above, so this module stays free of 'astro:content'

type Token = readonly [cssVar: string, fallback: string];

export const SECTION_TOKEN: Record<string, Token> = {
  root: ["--color-ink", "#12161d"],
  development: ["--color-accent", "#1e7a85"],
  osint: ["--color-status-paused", "#9a7b3f"],
  services: ["--color-status-development", "#3d6fb4"],
  about: ["--color-muted", "#5a6472"],
};

export const FALLBACK_TOKEN: Token = ["--color-muted", "#5a6472"];
export const EDGE_TOKEN: Token = ["--color-hairline", "#d4d8de"];
// GL lines get no antialiasing help, so hairline reads as nothing against the
// dark ground. The flat SVG keeps hairline; the live scene needs more contrast.
export const EDGE_LIVE_TOKEN: Token = ["--color-muted", "#5a6472"];

export const tokenFor = (section: string): Token =>
  SECTION_TOKEN[section] ?? FALLBACK_TOKEN;

export const cssValue = ([v, fallback]: Token) => `var(${v}, ${fallback})`;

export function resolvedValue([v, fallback]: Token): string {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  return raw || fallback;
}

// Fixed per kind. Size encodes structure, never how much was written — a
// volume-scaled node buries its own label.
export function nodeRadius(node: GraphNode): number {
  if (node.kind === "root") return 6.5;
  if (node.kind === "index") return 5;
  return 3.5;
}

export const isStructural = (node: GraphNode) => node.kind !== "page";

// Everything is labelled; collision rejection decides what actually fits.
export const deservesLabel = (_node: GraphNode) => true;
