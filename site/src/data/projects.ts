export type ProjectCategory = "main" | "client-work" | "labs";
export type ProjectStatus = "active" | "finished" | "paused" | "development";

export interface ProjectMeta {
  title: string;
  oneLiner: string;
  category: ProjectCategory;
  status: ProjectStatus;
  stack: string[];
  openSource?: boolean;
}

export const projectMeta: Record<string, ProjectMeta> = {
  chelicera: {
    title: "Chelicera",
    oneLiner: "Single-target OSINT reconnaissance crawler with a knowledge-graph UI.",
    category: "main",
    status: "active",
    stack: ["Go", "TypeScript", "React", "Redis", "SQLite", "Docker"],
    openSource: true,
  },
  stinger: {
    title: "Stinger",
    oneLiner: "Hybrid Go/Python SMTP verifier with a hand-written protocol implementation.",
    category: "main",
    status: "active",
    stack: ["Python", "Go", "SMTP"],
    openSource: true,
  },
  proxyc: {
    title: "Proxyc",
    oneLiner: "Async proxy checker in C, rewritten from Python for real throughput.",
    category: "main",
    status: "finished",
    stack: ["C", "libcurl", "SQLite"],
    openSource: true,
  },
  envgraph: {
    title: "EnvGraph",
    oneLiner: "Static analyzer that maps where every environment variable comes from and who reads it.",
    category: "main",
    status: "development",
    stack: ["Go", "Cobra", "JavaScript", "Cytoscape.js"],
    openSource: true,
  },
  webhookinbox: {
    title: "Webhook Inbox",
    oneLiner: "Self-hosted webhook inspection, search and replay platform.",
    category: "main",
    status: "finished",
    stack: ["Python", "FastAPI", "MongoDB", "htmx", "Docker"],
    openSource: true,
  },
  leadpipe: {
    title: "LeadPipe",
    oneLiner: "Lead collection pipeline with entity resolution and full field-level provenance.",
    category: "main",
    status: "finished",
    stack: ["Python", "PostgreSQL", "FastAPI", "SQLAlchemy", "Docker"],
    openSource: true,
  },
  twork: {
    title: "Twork",
    oneLiner: "Self-hosted Telegram job-hunting tool — monitors channels, indexes locally, matches deterministically.",
    category: "main",
    status: "active",
    stack: ["Go", "SQLite", "MTProto", "Telegram", "React"],
    openSource: true,
  },
  soundlight: {
    title: "SoundLight",
    oneLiner: "Local-first desktop music library with an embedded acquisition browser.",
    category: "main",
    status: "paused",
    stack: ["Rust", "Tauri", "React", "TypeScript", "SQLite"],
    openSource: true,
  },
  hostimg: {
    title: "HostIMG",
    oneLiner: "Content-addressable image hosting backend with real dedup accounting.",
    category: "main",
    status: "development",
    stack: ["Go", "PostgreSQL", "Redis", "Docker"],
  },
  exifdork: {
    title: "ExifDork",
    oneLiner: "OSINT document-metadata harvester, driven from Telegram. Paused.",
    category: "main",
    status: "paused",
    stack: ["Python", "Go", "PostgreSQL"],
  },
  peace_system: {
    title: "Peace System",
    oneLiner: "Hybrid Go/Python real-time system monitor with event-driven alerting.",
    category: "main",
    status: "paused",
    stack: ["Go", "Python", "React"],
    openSource: true,
  },
  news_summary: {
    title: "News Summary Bot",
    oneLiner: "RSS-to-Telegram summarizer with fuzzy near-duplicate filtering.",
    category: "main",
    status: "paused",
    stack: ["Python", "PostgreSQL", "Telegram"],
    openSource: true,
  },
  "client-work/webwell": {
    title: "Water-Well Drilling Company Site",
    oneLiner: "Marketing site with an outbox-backed lead pipeline and a Telegram bot for delivery.",
    category: "client-work",
    status: "finished",
    stack: ["Astro", "TypeScript", "Python", "SQLite", "Docker", "Caddy"],
  },
  "client-work/company_website": {
    title: "Corporate Landing Page",
    oneLiner: "Performance and SEO-focused static site built for a client.",
    category: "client-work",
    status: "development",
    stack: ["Astro", "TypeScript", "Tailwind"],
  },
  "client-work/school_projects": {
    title: "School Projects",
    oneLiner: "Earlier request-form sites built informally for classmates.",
    category: "client-work",
    status: "finished",
    stack: ["Python", "FastAPI"],
  },
  "labs/vps_setup": {
    title: "VPS Setup Scripts",
    oneLiner: "Growing collection of provisioning and hardening scripts.",
    category: "labs",
    status: "active",
    stack: ["Bash"],
  },
  "labs/proxy_strainer": {
    title: "Proxy Strainer",
    oneLiner: "First-ever repo — a Python proxy checker, later rewritten in C.",
    category: "labs",
    status: "finished",
    stack: ["Python"],
  },
  "labs/grpc_test": {
    title: "gRPC Test",
    oneLiner: "Small calculator service used to learn gRPC and Protobuf.",
    category: "labs",
    status: "finished",
    stack: ["Go", "gRPC"],
  },
  "labs/go_todo_cli": {
    title: "Go Todo CLI",
    oneLiner: "A tiny task tracker, written to take a break from a harder project.",
    category: "labs",
    status: "finished",
    stack: ["Go"],
  },
  "labs/go_live_sql": {
    title: "Go Live SQL",
    oneLiner: "Minimal Go backend for running raw SQL against Postgres.",
    category: "labs",
    status: "finished",
    stack: ["Go", "PostgreSQL"],
  },
};

export const statusLabel: Record<ProjectStatus, string> = {
  active: "Active",
  finished: "Finished",
  paused: "Paused",
  development: "In Development",
};
