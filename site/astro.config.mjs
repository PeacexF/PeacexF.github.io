// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import { rehypeStripMdLinks } from './src/lib/strip_md_links.mjs';

// https://astro.build/config
export default defineConfig({
  site: 'https://peacexf.github.io',
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()]
  },
  markdown: {
    rehypePlugins: [rehypeStripMdLinks]
  }
});