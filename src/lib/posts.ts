import fs from "fs";
import path from "path";
import matter from "gray-matter";

const postsDirectory = path.join(process.cwd(), "content", "posts");

export type PostMeta = {
  slug: string;
  title: string;
  date: string;
  description: string;
  tags: string[];
  viewCount?: number;
  sourceUrl?: string;
  articleId?: string;
  cover?: string;
};

export type Post = PostMeta & { content: string };

function parsePostFile(slug: string, fileContents: string): Post {
  const { data, content } = matter(fileContents);
  return {
    slug,
    title: String(data.title ?? slug),
    date: String(data.date ?? ""),
    description: String(data.description ?? ""),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    viewCount: data.viewCount ? Number(data.viewCount) : undefined,
    sourceUrl: data.sourceUrl ? String(data.sourceUrl) : undefined,
    articleId: data.articleId ? String(data.articleId) : undefined,
    cover: data.cover ? String(data.cover) : undefined,
    content,
  };
}

export function getAllPosts(): PostMeta[] {
  if (!fs.existsSync(postsDirectory)) return [];

  const files = fs
    .readdirSync(postsDirectory)
    .filter((f) => f.endsWith(".md"));

  const posts = files.map((fileName) => {
    const slug = fileName.replace(/\.md$/, "");
    const fullPath = path.join(postsDirectory, fileName);
    const fileContents = fs.readFileSync(fullPath, "utf8");
    const { data } = matter(fileContents);
    return {
      slug,
      title: String(data.title ?? slug),
      date: String(data.date ?? ""),
      description: String(data.description ?? ""),
      tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
      viewCount: data.viewCount ? Number(data.viewCount) : undefined,
      sourceUrl: data.sourceUrl ? String(data.sourceUrl) : undefined,
      articleId: data.articleId ? String(data.articleId) : undefined,
      cover: data.cover ? String(data.cover) : undefined,
    };
  });

  return posts.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

export function getPostBySlug(slug: string): Post | null {
  const fullPath = path.join(postsDirectory, `${slug}.md`);
  if (!fs.existsSync(fullPath)) return null;
  const fileContents = fs.readFileSync(fullPath, "utf8");
  return parsePostFile(slug, fileContents);
}

export function getAllSlugs(): string[] {
  if (!fs.existsSync(postsDirectory)) return [];
  return fs
    .readdirSync(postsDirectory)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));
}
