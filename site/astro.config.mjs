// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import { rehypeStripMdLinks } from './src/lib/strip_md_links.mjs';
import copyContentImages from './src/lib/copy-content-images.mjs';

// https://astro.build/config
export default defineConfig({
  site: 'https://peacexf.github.io',
  integrations: [sitemap(), copyContentImages()],
  vite: {
    plugins: [tailwindcss()]
  },
  markdown: {
    rehypePlugins: [rehypeStripMdLinks]
  }
});