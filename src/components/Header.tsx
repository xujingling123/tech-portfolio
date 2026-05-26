import Link from "next/link";
import { siteConfig } from "@/config/site";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0b0f19]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="group flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-cyan-400 text-sm font-bold text-white">
            J
          </span>
          <span className="font-semibold tracking-tight text-white group-hover:text-cyan-300 transition-colors">
            {siteConfig.name}
          </span>
        </Link>
        <nav className="flex items-center gap-1">
          {siteConfig.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-4 py-2 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
          <a
            href={siteConfig.csdnUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:border-cyan-500/50 hover:text-cyan-300"
          >
            CSDN
          </a>
        </nav>
      </div>
    </header>
  );
}
