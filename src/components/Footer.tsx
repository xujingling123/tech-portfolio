import Link from "next/link";
import { siteConfig } from "@/config/site";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-container py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3">
              <span className="logo-badge text-sm">J</span>
              <span className="font-semibold text-heading">{siteConfig.author}</span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
              {siteConfig.description}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
              导航
            </p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {siteConfig.nav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-subtle transition hover:text-accent"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
              外链
            </p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <a
                  href={siteConfig.csdnUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-subtle transition hover:text-accent"
                >
                  CSDN 博客
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-section pt-8 text-xs text-faint sm:flex-row">
          <p>
            © {new Date().getFullYear()} {siteConfig.author}. All rights reserved.
          </p>
          <p>博客内容迁移自 CSDN · 共 319+ 篇技术文章</p>
        </div>
      </div>
    </footer>
  );
}
