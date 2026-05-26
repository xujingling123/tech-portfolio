import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import { normalizeMarkdown } from "@/lib/markdown";
import { ArticleContent } from "./ArticleContent";

export async function markdownToHtml(content: string): Promise<string> {
  const normalized = normalizeMarkdown(content);

  const processed = await remark()
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeSlug)
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(normalized);

  return processed.toString();
}

export async function MarkdownContent({ content }: { content: string }) {
  const htmlContent = await markdownToHtml(content);
  return <ArticleContent html={htmlContent} />;
}
