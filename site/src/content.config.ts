import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

// mailrain.md and malbot.md are intentionally excluded
const projects = defineCollection({
  loader: glob({
    pattern: ["**/*.md", "!**/README.md", "!mailrain.md", "!malbot.md"],
    base: "../development/projects",
  }),
  schema: z.object({}),
});

const about = defineCollection({
  loader: glob({ pattern: ["*.md", "!README.md"], base: "../about" }),
  schema: z.object({}),
});

const services = defineCollection({
  loader: glob({ pattern: ["*.md", "!README.md"], base: "../services" }),
  schema: z.object({}),
});

const osint = defineCollection({
  loader: glob({ pattern: ["*.md", "!README.md"], base: "../osint" }),
  schema: z.object({}),
});

const osintCases = defineCollection({
  loader: glob({ pattern: "README.md", base: "../osint/cases" }),
  schema: z.object({}),
});

const devops = defineCollection({
  loader: glob({ pattern: ["*.md", "!README.md"], base: "../development/devops" }),
  schema: z.object({}),
});

const infrastructure = defineCollection({
  loader: glob({ pattern: ["*.md", "!README.md"], base: "../development/infrastructure" }),
  schema: z.object({}),
});

export const collections = {
  projects,
  about,
  services,
  osint,
  osintCases,
  devops,
  infrastructure,
};