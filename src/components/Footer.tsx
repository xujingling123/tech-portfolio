import { siteConfig } from "@/config/site";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-[#080c14]">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-slate-500 sm:flex-row">
        <p>
          © {new Date().getFullYear()} {siteConfig.author} · 技术博客
        </p>
        <p className="text-slate-600">
          内容迁移自{" "}
          <a
            href={siteConfig.csdnUrl}
            className="text-cyan-500/80 hover:text-cyan-400"
            target="_blank"
            rel="noopener noreferrer"
          >
            CSDN
          </a>
        </p>
      </div>
    </footer>
  );
}
