import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { ToolsSubnav } from "@/components/tools/ToolsSubnav";
import { toolsConfig } from "@/config/tools";

export const metadata = {
  title: "工具",
};

export default function ToolsPage() {
  return (
    <div className="site-container py-12 md:py-16">
      <PageHeader
        label="Tools"
        title={toolsConfig.title}
        description={toolsConfig.description}
      />
      <ToolsSubnav />

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        {toolsConfig.items.map((tool) => (
          <Link
            key={tool.slug}
            href={tool.href}
            className="tool-card group"
          >
            <span className="tool-card-icon">{tool.icon}</span>
            <h2 className="tool-card-title">{tool.title}</h2>
            <p className="tool-card-desc">{tool.description}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {tool.tags.map((tag) => (
                <span key={tag} className="tag">
                  {tag}
                </span>
              ))}
            </div>
            <span className="post-card-arrow mt-4 inline-block" aria-hidden>
              进入工具 →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
