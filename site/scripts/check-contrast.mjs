// WCAG AA contrast check over the real design tokens

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(here, "../src/styles/global.css"), "utf8");

function blockAt(open) {
  let depth = 0;
  for (let i = open; i < css.length; i++) {
    if (css[i] === "{") depth++;
    else if (css[i] === "}" && --depth === 0) return css.slice(open, i);
  }
  throw new Error("unbalanced braces in global.css");
}

function colorsIn(body) {
  const out = {};
  for (const m of body.matchAll(/--color-([a-z-]+):\s*(#[0-9a-fA-F]{6})/g)) {
    out[m[1]] = m[2].toLowerCase();
  }
  return out;
}

function tokensFrom(selector) {
  for (const m of css.matchAll(selector)) {
    const open = css.indexOf("{", m.index);
    if (open === -1) continue;
    const found = colorsIn(blockAt(open));
    if (Object.keys(found).length > 0) return found;
  }
  throw new Error(`no colour-declaring block for ${selector}`);
}

const lin = (c) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
};
const lum = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
};
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (hi + 0.05) / (lo + 0.05);
};

const light = tokensFrom(/@theme/g);
// Dark only overrides, anything it does not redefine is inherited from light
const darkOverrides = tokensFrom(/\[data-theme="dark"\]/g);
const dark = { ...light, ...darkOverrides };

// A dark palette that overrode nothing would silently be the light one
if (Object.keys(darkOverrides).length === 0) {
  console.error("dark theme declared no colours — the selector match is wrong");
  process.exit(1);
}

const GROUNDS = ["paper", "surface", "raised"];
const FOREGROUNDS = [
  "ink",
  "muted",
  "accent",
  "amber",
  "status-active",
  "status-finished",
  "status-paused",
  "status-development",
];

let failures = 0;

for (const [name, palette] of [["LIGHT", light], ["DARK", dark]]) {
  console.log(`\n=== ${name} ===`);
  for (const ground of GROUNDS) {
    for (const fg of FOREGROUNDS) {
      if (!palette[fg] || !palette[ground]) continue;
      const r = ratio(palette[fg], palette[ground]);
      const ok = r >= 4.5;
      if (!ok) failures++;
      console.log(
        `  ${`${fg} on ${ground}`.padEnd(30)}${r.toFixed(2).padStart(6)}:1  ${ok ? "AA" : "** FAIL **"}`,
      );
    }
  }
  for (const ground of GROUNDS) {
    if (!palette[ground]) continue;
    const r = ratio(palette.hairline, palette[ground]);
    console.log(`  ${`hairline on ${ground}`.padEnd(30)}${r.toFixed(2).padStart(6)}:1  (not enforced)`);
  }
}

if (failures > 0) {
  console.error(`\n${failures} pair(s) below AA 4.5:1`);
  process.exit(1);
}
console.log("\nAll enforced pairs clear AA 4.5:1");
