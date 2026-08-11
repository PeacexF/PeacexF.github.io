## What this repo is

A personal engineering portfolio for **Peace**, a backend & infrastructure / fullstack
engineer. It serves two purposes at once:

1. **A browsable Markdown portfolio on GitHub** — every directory has its own
   `README.md` so a visitor can navigate the repo directly.
2. **A deployed static website** (`site/`, built with Astro) served at
   `https://peacexf.github.io/` via GitHub Pages.

The Markdown files are the single source of truth. The website reads them
directly at build time — content is never duplicated.

## Repository structure

```
/                       Root README.md (+ README.ru.md), LICENSE, CONTRIBUTING.md
about/                  Background: contact, engineering_principles, faq (+ README index)
services/               What Peace can be hired for: backend, automation, telegram,
                        architecture, deployment, research, guidance (+ README index)
osint/                  OSINT work: skills, pentesting, cases/ (+ README index)
development/
  README.md             Overview of the development section
  devops/               Capability page: skills, cases (+ README)
  infrastructure/       Capability page: skills, system_design (+ README)
  projects/             The actual portfolio of built things (+ README index)
    <project>.md        Main projects (chelicera, stinger, proxyc, hostimg,
                        exifdork, peace_system, news_summary, ...)
    client-work/        Commercial work (+ README)
    labs/               Small / learning projects (+ README)
assets/                 pfp image, shared assets
site/                   Astro website (see "The website" below)
.github/workflows/      CI: link-check.yml, deploy-pages.yml
```

## Working conventions (how we operate in chat)

These are the habits established while building this repo. Follow them.

- **Never invent facts.** Project write-ups are based on reading the actual
  source code, not guessing. Metrics, dates, and claims must be confirmed by
  the user or verifiable in the repo. When something is unfinished or weak,
  say so plainly rather than inflating it — honest framing is the house style.
- **Voice:** calm, technical, engineer-not-marketer. Explain reasoning and
  tradeoffs. No buzzwords, no hype. First-person is fine but shouldn't feel
  forced.
- **Two projects are intentionally undocumented** (`malbot.md`,
  `mailrain.md`) — they hold placeholder pages explaining why, and are
  excluded from the website build. Do not write case studies for them, and
  do not surface them as project cards. This is a deliberate line, not an
  oversight.
- **Verify, don't assume.** After any site change, rebuild and check the
  actual output (build succeeds, links resolve, content renders) rather than
  trusting that it "should" work.
- **When fitting content to a constraint** (e.g. a one-page PDF), measure the
  problem once and solve it deliberately — don't nibble incrementally.

## Project case-study structure

Each project `.md` follows a consistent shape (adapt as the project warrants):
Overview · Engineering Summary · Key Features · Technical Stack · Architecture
(with a Mermaid diagram) · Interesting Engineering Decisions · Challenges ·
Performance/Reliability/Security (as relevant) · Lessons Learned ·
Technologies Demonstrated · Suitable Portfolio Categories.

Keep depth proportional to the project — labs get short write-ups, flagship
projects get full ones. Don't pad a small project to look bigger.

## The website (`site/`)

Astro + Tailwind CSS v4. Deployed to GitHub Pages at the domain root
(`peacexf.github.io`), which is why the repo is named `PeacexF.github.io` and
the site uses root-relative links (no base path).

Key pieces:

- **Content collections** (`src/content.config.ts`) glob the Markdown files
  from `about/`, `services/`, `osint/`, `development/` at the repo root.
  `README.md` files, `mailrain.md`, and `malbot.md` are excluded.
- **`src/data/projects.ts`** — the one place mapping each project to its
  display metadata (title, one-liner, category, status, stack). Update this
  when adding a project; the `.md` files themselves stay untouched.
- **`src/lib/`** helpers:
  - `strip_md_links` (rehype plugin) — strips `.md` from internal links so
    the same link works on GitHub and on the site.
  - `doc_meta` — derives title/one-liner from a doc's first heading/paragraph.
  - `copy-content-images` — mirrors images sitting next to Markdown files into
    the build output. Reference images with **root-relative paths**
    (`/development/projects/foo.png`) so they resolve on both GitHub and the
    live site.
- **Design tokens** live in `src/styles/global.css` — cool paper background,
  near-black ink, single teal accent; Space Grotesk (display), IBM Plex Sans
  (body), IBM Plex Mono (data/labels). The filesystem-style breadcrumb is a
  deliberate signature element.
- **Mermaid diagrams** in Markdown render client-side, re-themed to the
  palette (`src/components/Mermaid.astro`).

### Adding a new project

1. Write the case study at `development/projects/<name>.md` (read the real
   source first).
2. Add an entry to `src/data/projects.ts`.
3. Link it from the relevant `README.md` index.
4. Rebuild (`npm run build` in `site/`) and confirm it renders and links
   resolve.

Information about the project will be supplied to you via a .zip file in the repo root, with the name of the zip matching the name of the project.  
Unless the user specified where to put the .md summary of the projects (`projects/` or `projects/client-work` or `projects/labs`) you must ask him.  

### Build & deploy

- `cd site && npm install && npm run build` — builds to `site/dist/`.
- Pushing to `main` triggers `.github/workflows/deploy-pages.yml`, which
  builds and deploys to GitHub Pages. Pages Source must be set to
  "GitHub Actions" in repo settings.
- `.github/workflows/link-check.yml` runs lychee against the Markdown on
  every push/PR.
- A Dockerfile + docker-compose.yml exist at the root for self-hosted
  deployment (Nginx serving the static build).

## Still open / possible next steps

- `osint/cases/` is a placeholder — real case write-ups planned.
- GitHub repo links not yet added to the open-source project write-ups.
- Real product screenshots (Chelicera graph UI, Peace System dashboard) would
  strengthen those case studies — the image pipeline is ready for them.
- Contact placeholders (`<email>` etc.) in the root READMEs should hold real
  values in the published version.