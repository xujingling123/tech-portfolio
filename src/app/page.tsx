import Link from "next/link";
import { PostCard } from "@/components/PostCard";
import { siteConfig } from "@/config/site";
import { getAllPosts } from "@/lib/posts";

const skillIcons: Record<string, string> = {
  前端: "◆",
  "地图/GIS": "◎",
  移动端: "◇",
  后端: "▣",
  架构: "✦",
};

export default function HomePage() {
  const posts = getAllPosts();
  const latestPosts = posts.slice(0, 6);
  const totalViews = posts.reduce((sum, p) => sum + (p.viewCount ?? 0), 0);

  return (
    <div>
      <section className="relative overflow-hidden border-b border-section">
        <div className="site-container py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <p className="page-header-label">全栈开发 · 技术分享</p>
            <h1 className="text-4xl font-bold tracking-tight text-heading md:text-5xl lg:text-[3.25rem] lg:leading-[1.15]">
              你好，我是 <span className="gradient-text">{siteConfig.author}</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-subtle md:text-lg">
              {siteConfig.description}
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link href="/blog" className="btn-primary">
                阅读博客
              </Link>
              <Link href="/about" className="btn-ghost">
                关于我
              </Link>
            </div>
          </div>

          <div className="mx-auto mt-14 grid max-w-2xl grid-cols-3 gap-3 sm:max-w-none sm:grid-cols-3 lg:max-w-3xl">
            <div className="stat-pill">
              <p className="stat-pill-value">{posts.length}</p>
              <p className="stat-pill-label">技术文章</p>
            </div>
            <div className="stat-pill">
              <p className="stat-pill-value">{siteConfig.skills.length}</p>
              <p className="stat-pill-label">技术方向</p>
            </div>
            <div className="stat-pill">
              <p className="stat-pill-value">
                {totalViews > 10000
                  ? `${Math.round(totalViews / 10000)}万+`
                  : totalViews.toLocaleString()}
              </p>
              <p className="stat-pill-label">累计阅读</p>
            </div>
          </div>

          <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {siteConfig.skills.map((skill) => (
              <div key={skill.name} className="skill-card">
                <span className="skill-card-icon">
                  {skillIcons[skill.name] ?? "•"}
                </span>
                <h3 className="mt-3 text-sm font-semibold text-heading">
                  {skill.name}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-muted">
                  {skill.items.join(" · ")}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="site-container py-16 md:py-20">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="page-header-label">Blog</p>
            <h2 className="text-2xl font-bold text-heading md:text-3xl">
              最新文章
            </h2>
          </div>
          <Link
            href="/blog"
            className="inline-flex items-center gap-1 text-sm font-medium text-accent transition hover:opacity-80"
          >
            查看全部
            <span aria-hidden>→</span>
          </Link>
        </div>
        {latestPosts.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {latestPosts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        ) : (
          <p className="glass-card p-10 text-center text-muted">
            暂无文章，请运行{" "}
            <code className="inline-code">npm run migrate:csdn</code>
          </p>
        )}
      </section>
    </div>
  );
}
