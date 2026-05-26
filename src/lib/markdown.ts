/** 规范化 CSDN 迁移后的 Markdown 正文 */
export function normalizeMarkdown(content: string): string {
  return content
    .replace(/^\uFEFF/, "")
    .replace(/^---+(?=#)/, "")
    .replace(/\\([#*_[\]`])/g, "$1")
    .replace(/^(#{1,6}\s+\d+)\\\./gm, "$1.")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export type HeadingItem = {
  id: string;
  text: string;
  level: number;
};

export function extractHeadings(content: string): HeadingItem[] {
  const normalized = normalizeMarkdown(content);
  const headings: HeadingItem[] = [];

  for (const line of normalized.split("\n")) {
    const match = line.match(/^(#{2,3})\s+(.+)$/);
    if (!match) continue;

    const level = match[1].length;
    const text = match[2]
      .replace(/\\([#*_[\]`])/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .trim();

    if (!text) continue;

    headings.push({
      id: slugifyHeading(text),
      text,
      level,
    });
  }

  return headings;
}

function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fff\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
