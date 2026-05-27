import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import type { PostMeta } from "@/lib/posts";

export function PostCard({ post }: { post: PostMeta }) {
  const dateStr = post.date
    ? format(new Date(post.date), "yyyy年M月d日", { locale: zhCN })
    : "";

  return (
    <article className="post-card group">
      <Link href={`/blog/${post.slug}`} className="flex h-full flex-col">
        {post.cover ? (
          <div className="post-card-cover">
            <Image
              src={post.cover}
              alt=""
              fill
              className="object-cover transition duration-500 group-hover:scale-[1.03]"
              sizes="(max-width: 768px) 100vw, 400px"
            />
            <div className="post-card-cover-overlay" />
          </div>
        ) : (
          <div className="post-card-cover post-card-cover--placeholder">
            <span>{"</>"}</span>
          </div>
        )}

        <div className="flex flex-1 flex-col p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
            {dateStr && <time dateTime={post.date}>{dateStr}</time>}
            {post.viewCount != null && post.viewCount > 0 && (
              <>
                <span className="text-faint">·</span>
                <span>{post.viewCount.toLocaleString()} 阅读</span>
              </>
            )}
          </div>

          <h2 className="post-card-title">{post.title}</h2>

          {post.description && (
            <p className="mt-2 flex-1 text-sm leading-relaxed text-subtle line-clamp-2">
              {post.description}
            </p>
          )}

          <div className="mt-4 flex items-end justify-between gap-3">
            {post.tags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {post.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="tag">
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              <span />
            )}
            <span className="post-card-arrow" aria-hidden>
              →
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
