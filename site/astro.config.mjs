// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import { rehypeStripMdLinks } from './src/lib/strip_md_links.mjs';

// https://astro.build/config
export default defineConfig({
  site: 'https://peacexf.github.io',
  vite: {
    plugins: [tailwindcss()]
  },
  markdown: {
    rehypePlugins: [rehypeStripMdLinks]
  }
});