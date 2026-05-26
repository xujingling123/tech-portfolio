import Link from "next/link";
import { PostCard } from "@/components/PostCard";
import { siteConfig } from "@/config/site";
import { getAllPosts } from "@/lib/posts";

export default function HomePage() {
  const posts = getAllPosts();
  const latestPosts = posts.slice(0, 6);

  return (
    <div>
      <section className="relative overflow-hidden border-b border-white/5">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(120,80,255,0.25),transparent)]" />
        <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 bg-cyan-500/10 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-6 py-24 md:py-32">
          <p className="mb-4 text-sm font-medium uppercase tracking-widest text-cyan-400/90">
            全栈开发 · 技术分享
          </p>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
            你好，我是{" "}
            <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
              {siteConfig.author}
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-400">
            {siteConfig.description}。博客内容已从 CSDN 迁移至本站，涵盖地图 GIS、
            uni-app、Flutter、CSS 动效、系统架构师备考等主题。
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/blog"
              className="rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-violet-500/20 transition hover:opacity-90"
            >
              阅读博客
            </Link>
            <Link
              href="/about"
              className="rounded-xl border border-white/10 px-6 py-3 text-sm font-medium text-slate-300 transition hover:border-white/20 hover:text-white"
            >
              关于我
            </Link>
          </div>
          <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {siteConfig.skills.map((skill) => (
              <div
                key={skill.name}
                className="rounded-xl border border-white/5 bg-white/[0.02] p-4"
              >
                <h3 className="text-sm font-semibold text-violet-300">
                  {skill.name}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-500">
                  {skill.items.join(" · ")}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">最新文章</h2>
            <p className="mt-1 text-sm text-slate-500">
              共 {posts.length} 篇技术博客
            </p>
          </div>
          <Link
            href="/blog"
            className="text-sm text-cyan-400 hover:text-cyan-300"
          >
            查看全部 →
          </Link>
        </div>
        {latestPosts.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {latestPosts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-white/10 p-8 text-center text-slate-500">
            暂无文章，请运行{" "}
            <code className="text-violet-300">npm run migrate:csdn</code>{" "}
            从 CSDN 导入博客。
          </p>
        )}
      </section>
    </div>
  );
}
