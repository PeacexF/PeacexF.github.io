import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";


const IMAGE_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".svg",
  ".webp",
  ".avif",
]);

const CONTENT_DIRS = ["about", "services", "osint", "development"];

function copyImages(srcDir, destDir, logger) {
  if (!fs.existsSync(srcDir)) return 0;
  let count = 0;
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      count += copyImages(srcPath, destPath, logger);
    } else if (IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      fs.mkdirSync(destDir, { recursive: true });
      fs.copyFileSync(srcPath, destPath);
      count += 1;
    }
  }
  return count;
}

export default function copyContentImages() {
  return {
    name: "copy-content-images",
    hooks: {
      "astro:config:setup": ({ logger, config }) => {
        const siteRoot = path.dirname(fileURLToPath(import.meta.url));
        const repoRoot = path.resolve(siteRoot, "..", "..", "..");
        const publicDir = fileURLToPath(config.publicDir);

        let total = 0;
        for (const dir of CONTENT_DIRS) {
          const src = path.join(repoRoot, dir);
          const dest = path.join(publicDir, dir);
          total += copyImages(src, dest, logger);
        }
        logger.info(`copy-content-images: mirrored ${total} image(s) from content directories into public/`);
      },
    },
  };
}