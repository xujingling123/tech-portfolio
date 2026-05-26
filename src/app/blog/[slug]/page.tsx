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
    <div className="border-b border-white/5 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(99,102,241,0.12),transparent)]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* 顶栏导航 */}
        <div className="py-6">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 transition hover:text-cyan-400"
          >
            <span aria-hidden>←</span>
            返回博客列表
          </Link>
        </div>

        {/* 文章头部 */}
        <header className="mx-auto max-w-3xl pb-10 text-center lg:max-w-4xl">
          <div className="mb-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-slate-500">
            {dateStr && <time dateTime={post.date}>{dateStr}</time>}
            {post.viewCount != null && post.viewCount > 0 && (
              <>
                <span className="text-slate-700">·</span>
                <span>{post.viewCount.toLocaleString()} 阅读</span>
              </>
            )}
          </div>

          <h1 className="text-2xl font-bold leading-snug tracking-tight text-white sm:text-3xl lg:text-4xl lg:leading-tight">
            {post.title}
          </h1>

          {post.description && (
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-400">
              {post.description}
            </p>
          )}

          {post.tags.length > 0 && (
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs text-violet-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </header>

        {post.cover && (
          <div className="relative mx-auto mb-12 aspect-[21/9] max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-2xl shadow-violet-950/30">
            <ZoomableImage
              src={post.cover}
              alt={post.title}
              fill
              sizes="(max-width: 896px) 100vw, 896px"
              priority
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#060a12]/60 via-transparent to-transparent" />
          </div>
        )}
      </div>

      {/* 正文区：目录 + 内容 */}
      <div className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-12">
          {headings.length >= 2 && (
            <aside className="order-2 lg:order-1 lg:sticky lg:top-24 lg:w-56 lg:shrink-0 xl:w-64">
              <ArticleToc headings={headings} />
            </aside>
          )}

          <article
            className={`order-1 min-w-0 flex-1 ${
              headings.length >= 2 ? "lg:max-w-none" : "mx-auto max-w-3xl"
            }`}
          >
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] px-5 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
              <MarkdownContent content={post.content} />
            </div>

            {post.sourceUrl && (
              <footer className="mt-8 flex flex-col gap-3 rounded-xl border border-white/8 bg-white/[0.02] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500">
                  本文由 CSDN 迁移至本站，保留原文链接便于对照。
                </p>
                <a
                  href={post.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-400 transition hover:bg-cyan-500/20"
                >
                  在 CSDN 查看原文 →
                </a>
              </footer>
            )}
            {!post.sourceUrl && (
              <footer className="mt-8 text-center text-sm text-slate-600">
                <a
                  href={siteConfig.csdnUrl}
                  className="text-cyan-500/80 hover:text-cyan-400"
                >
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
