import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const POSTS_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "content",
  "posts",
);

function escapeYaml(str) {
  if (!str) return '""';
  const s = String(str)
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, " ")
    .replace(/\r/g, "");
  return `"${s}"`;
}

function fixFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  if (!raw.startsWith("---")) return false;

  const end = raw.indexOf("\n---", 3);
  if (end === -1) return false;

  const body = raw.slice(end + 4).replace(/^\n/, "");
  const fmBlock = raw.slice(3, end);
  const lines = fmBlock.split("\n");
  const data = {};

  for (const line of lines) {
    const m = line.match(/^(\w+):\s*(.*)$/);
    if (!m) continue;
    const [, key, val] = m;
    if (key === "tags") {
      data.tags = val
        .replace(/^\[|\]$/g, "")
        .split(",")
        .map((t) => t.trim().replace(/^"|"$/g, ""))
        .filter(Boolean);
    } else if (val === "null" || val === "") {
      data[key] = "";
    } else {
      data[key] = val.replace(/^"|"$/g, "").replace(/\\"/g, '"');
    }
  }

  const tags = (data.tags || []).map((t) => escapeYaml(t)).join(", ");
  const frontmatter = [
    "---",
    `title: ${escapeYaml(data.title)}`,
    `date: ${escapeYaml(data.date)}`,
    `description: ${escapeYaml(data.description)}`,
    `tags: [${tags}]`,
    `viewCount: ${data.viewCount ?? 0}`,
    `articleId: "${data.articleId || ""}"`,
    `sourceUrl: ${escapeYaml(data.sourceUrl)}`,
    data.cover ? `cover: ${escapeYaml(data.cover)}` : null,
    "---",
    "",
  ]
    .filter(Boolean)
    .join("\n");

  fs.writeFileSync(filePath, frontmatter + body, "utf8");
  return true;
}

let count = 0;
for (const f of fs.readdirSync(POSTS_DIR)) {
  if (!f.endsWith(".md")) continue;
  if (fixFile(path.join(POSTS_DIR, f))) count++;
}
console.log(`已修复 ${count} 篇文章 frontmatter`);
