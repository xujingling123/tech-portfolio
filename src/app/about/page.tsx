import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { siteConfig } from "@/config/site";

export const metadata = {
  title: "关于",
};

export default function AboutPage() {
  return (
    <div className="site-container py-12 md:py-16">
      <PageHeader label="About" title="关于我" />

      <div className="glass-card p-8 md:p-10">
        <div className="flex flex-col items-center gap-6 border-b border-section pb-8 text-center sm:flex-row sm:text-left">
          <span className="logo-badge h-16 w-16 text-2xl">J</span>
          <div>
            <h2 className="text-xl font-bold text-heading">{siteConfig.author}</h2>
            <p className="mt-1 text-sm text-muted">全栈 · 地图 GIS · 跨端开发</p>
          </div>
        </div>

        <div className="mt-8 space-y-5 text-base leading-relaxed text-subtle">
          <p>
            你好，我是 <strong className="text-strong">{siteConfig.author}</strong>
            ，一名专注于全栈与地图 GIS 方向的技术开发者。
          </p>
          <p>
            技术栈覆盖 Vue / React / uni-app、高德与 Mapbox 地图、Flutter 跨端、
            Spring Boot 后端，以及系统架构师相关备考与实战总结。
          </p>
          <p>
            本站用于集中展示个人技术博客与项目经验。文章原发布于{" "}
            <a
              href={siteConfig.csdnUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="link-accent"
            >
              CSDN（jingling555）
            </a>
            ，已批量迁移至本站以便统一管理与展示。
          </p>
        </div>

        <h3 className="mt-10 text-sm font-semibold uppercase tracking-wider text-muted">
          技术方向
        </h3>
        <ul className="mt-5 grid gap-4 sm:grid-cols-2">
          {siteConfig.skills.map((skill) => (
            <li key={skill.name} className="skill-card">
              <span className="text-sm font-semibold text-accent">
                {skill.name}
              </span>
              <p className="mt-2 text-sm text-muted">{skill.items.join("、")}</p>
            </li>
          ))}
        </ul>

        <div className="mt-10 flex flex-wrap gap-4">
          <Link href="/blog" className="btn-primary">
            浏览博客
          </Link>
          <a
            href={siteConfig.csdnUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost"
          >
            访问 CSDN
          </a>
        </div>
      </div>
    </div>
  );
}
