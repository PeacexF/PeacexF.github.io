import path from "node:path";
import { fileURLToPath } from "node:url";
import { visit } from "unist-util-visit";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

// Rewrites the links inside content Markdown so the same href works in two places.
export function rehypeStripMdLinks() {
  return (tree, file) => {
    const source = file?.history?.[0] ?? file?.path;

    visit(tree, "element", (node) => {
      if (node.tagName !== "a" || !node.properties?.href) return;

      const href = String(node.properties.href);
      if (/^(https?:|mailto:|tel:|#|\/)/.test(href)) return;

      const stripped = href.replace(/\.md(#.*)?$/, (_, fragment) => fragment ?? "");
      if (!source) {
        node.properties.href = stripped;
        return;
      }

      // The fragment must not go through the path join
      const hash = stripped.indexOf("#");
      const target = hash === -1 ? stripped : stripped.slice(0, hash);
      const fragment = hash === -1 ? "" : stripped.slice(hash);

      const dir = path.dirname(path.relative(REPO_ROOT, source));
      const resolved = path.posix.normalize(
        path.posix.join("/", ...dir.split(path.sep), target),
      );

      node.properties.href = resolved + fragment;
    });
  };
}
