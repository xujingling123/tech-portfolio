"use client";

import type { HeadingItem } from "@/lib/markdown";

export function ArticleToc({ headings }: { headings: HeadingItem[] }) {
  if (headings.length < 2) return null;

  return (
    <nav aria-label="文章目录" className="toc-panel">
      <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
        <span className="toc-dot" aria-hidden />
        目录
      </p>
      <ul className="max-h-[calc(100vh-8rem)] space-y-0.5 overflow-y-auto pr-1">
        {headings.map((h) => (
          <li
            key={`${h.id}-${h.text}`}
            className={h.level === 3 ? "toc-border-sub" : ""}
          >
            <a href={`#${h.id}`} className="toc-link line-clamp-2">
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
