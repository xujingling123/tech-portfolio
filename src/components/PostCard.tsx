import Link from "next/link";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import type { PostMeta } from "@/lib/posts";

export function PostCard({ post }: { post: PostMeta }) {
  const dateStr = post.date
    ? format(new Date(post.date), "yyyy年M月d日", { locale: zhCN })
    : "";

  return (
    <article className="group rounded-2xl border border-white/5 bg-white/[0.02] p-6 transition hover:border-violet-500/30 hover:bg-white/[0.04]">
      <Link href={`/blog/${post.slug}`} className="block space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          {dateStr && <time dateTime={post.date}>{dateStr}</time>}
          {post.viewCount != null && post.viewCount > 0 && (
            <>
              <span>·</span>
              <span>{post.viewCount.toLocaleString()} 阅读</span>
            </>
          )}
        </div>
        <h2 className="text-lg font-semibold text-white group-hover:text-cyan-300 transition-colors line-clamp-2">
          {post.title}
        </h2>
        {post.description && (
          <p className="text-sm leading-relaxed text-slate-400 line-clamp-2">
            {post.description}
          </p>
        )}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {post.tags.slice(0, 5).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-violet-500/10 px-2.5 py-0.5 text-xs text-violet-300"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </Link>
    </article>
  );
}
