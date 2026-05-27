import Link from "next/link";
import { siteConfig } from "@/config/site";
import { HeaderNav } from "./HeaderNav";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  return (
    <header className="site-header">
      <div className="site-container flex h-[4.25rem] items-center justify-between gap-4">
        <Link href="/" className="group flex min-w-0 items-center gap-3">
          <span className="logo-badge">J</span>
          <div className="hidden sm:block">
            <span className="logo-text block truncate">{siteConfig.name}</span>
            <span className="logo-subtext block">技术博客</span>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <HeaderNav />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
