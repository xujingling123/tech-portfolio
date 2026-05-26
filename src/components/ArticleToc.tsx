"use client";

import type { HeadingItem } from "@/lib/markdown";

export function ArticleToc({ headings }: { headings: HeadingItem[] }) {
  if (headings.length < 2) return null;

  return (
    <nav
      aria-label="文章目录"
      className="rounded-xl border border-white/8 bg-white/[0.02] p-5"
    >
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
        目录
      </p>
      <ul className="space-y-2 text-sm">
        {headings.map((h) => (
          <li
            key={`${h.id}-${h.text}`}
            className={h.level === 3 ? "pl-3 border-l border-white/5" : ""}
          >
            <a
              href={`#${h.id}`}
              className="line-clamp-2 text-slate-400 transition hover:text-cyan-400"
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
