import Link from "next/link";
import { notFound } from "next/navigation";
import { ZoomableImage } from "@/components/ZoomableImage";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { MarkdownContent } from "@/components/MarkdownContent";
import { ArticleToc } from "@/components/ArticleToc";
import { extractHeadings } from "@/lib/markdown";
import { getAllSlugs, getPostBySlug } from "@/lib/posts";
import { siteConfig } from "@/config/site";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "文章未找到" };
  return {
    title: post.title,
    description: post.description,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const headings = extractHeadings(post.content);
  const dateStr = post.date
    ? format(new Date(post.date), "yyyy年M月d日", { locale: zhCN })
    : "";

  return (
    <div className="article-shell">
      <div className="site-container pt-6">
        <Link href="/blog" className="back-link">
          <span aria-hidden>←</span>
          返回博客列表
        </Link>

        <header className="mx-auto max-w-3xl py-10 text-center lg:max-w-4xl">
          <div className="mb-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-muted">
            {dateStr && <time dateTime={post.date}>{dateStr}</time>}
            {post.viewCount != null && post.viewCount > 0 && (
              <>
                <span className="text-faint">·</span>
                <span>{post.viewCount.toLocaleString()} 阅读</span>
              </>
            )}
          </div>

          <h1 className="text-2xl font-bold leading-snug tracking-tight text-heading sm:text-3xl lg:text-4xl lg:leading-tight">
            {post.title}
          </h1>

          {post.description && (
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-subtle">
              {post.description}
            </p>
          )}

          {post.tags.length > 0 && (
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {post.tags.map((tag) => (
                <span key={tag} className="tag">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </header>

        {post.cover && (
          <div className="cover-frame">
            <ZoomableImage
              src={post.cover}
              alt={post.title}
              fill
              sizes="(max-width: 896px) 100vw, 896px"
              priority
            />
            <div className="cover-frame-fade" />
          </div>
        )}
      </div>

      <div className="site-container pb-20">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-10">
          {headings.length >= 2 && (
            <aside className="order-2 lg:order-1 lg:sticky lg:top-[5.5rem] lg:w-56 lg:shrink-0 xl:w-60">
              <ArticleToc headings={headings} />
            </aside>
          )}

          <article
            className={`order-1 min-w-0 flex-1 ${
              headings.length >= 2 ? "lg:max-w-none" : "mx-auto max-w-3xl"
            }`}
          >
            <div className="article-panel">
              <MarkdownContent content={post.content} />
            </div>

            {post.sourceUrl && (
              <footer className="mt-8 flex flex-col gap-4 glass-card p-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted">
                  本文由 CSDN 迁移至本站，保留原文链接便于对照。
                </p>
                <a
                  href={post.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ghost shrink-0 py-2.5 text-sm text-accent"
                >
                  在 CSDN 查看原文 →
                </a>
              </footer>
            )}
            {!post.sourceUrl && (
              <footer className="mt-8 text-center text-sm text-faint">
                <a href={siteConfig.csdnUrl} className="text-accent hover:opacity-80">
                  访问 CSDN 博客
                </a>
              </footer>
            )}
          </article>
        </div>
      </div>
    </div>
  );
}
