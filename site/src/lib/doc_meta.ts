export function extractDocMeta(body: string): { title: string; oneLiner: string } {
  const lines = body.split("\n");

  const titleLine = lines.find((l) => l.startsWith("# "));
  const title = titleLine ? titleLine.replace(/^#\s+/, "").trim() : "Untitled";

  const titleIndex = titleLine ? lines.indexOf(titleLine) : -1;
  const rest = lines.slice(titleIndex + 1);

  const firstParagraph = rest.find(
    (l) => l.trim().length > 0 && !l.trim().startsWith("#") && l.trim() !== "---",
  );

  const oneLiner = firstParagraph
    ? firstParagraph.trim().split(/(?<=[.?!])\s/)[0]
    : "";

  return { title, oneLiner };
}