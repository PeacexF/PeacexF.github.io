import { visit } from "unist-util-visit";

// strips a .md so that we don't have 404's in the website cuz of "/projects/labs/proxy_strainer.md"
export function rehypeStripMdLinks() {
  return (tree) => {
    visit(tree, "element", (node) => {
      if (node.tagName !== "a" || !node.properties?.href) return;

      const href = String(node.properties.href);
      if (/^(https?:|mailto:|tel:|#)/.test(href)) return;

      node.properties.href = href.replace(/\.md(#.*)?$/, (_, fragment) => fragment ?? "");
    });
  };
}