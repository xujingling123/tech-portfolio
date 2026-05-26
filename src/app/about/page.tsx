import { siteConfig } from "@/config/site";

export const metadata = {
  title: "关于",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-bold text-white">关于我</h1>
      <div className="mt-8 space-y-6 text-slate-400 leading-relaxed">
        <p>
          你好，我是 <strong className="text-white">{siteConfig.author}</strong>
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
            className="text-cyan-400 hover:underline"
          >
            CSDN（jingling555）
          </a>
          ，已批量迁移至本站以便统一管理与展示。
        </p>
        <h2 className="pt-4 text-xl font-semibold text-white">技术方向</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {siteConfig.skills.map((skill) => (
            <li
              key={skill.name}
              className="rounded-xl border border-white/5 bg-white/[0.02] p-4"
            >
              <span className="font-medium text-violet-300">{skill.name}</span>
              <p className="mt-2 text-sm">{skill.items.join("、")}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
