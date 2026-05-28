"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { toolsConfig } from "@/config/tools";

export function ToolsSubnav() {
  const pathname = usePathname();

  return (
    <nav className="tools-subnav" aria-label="工具导航">
      <Link
        href="/tools"
        className={`tools-subnav-link${pathname === "/tools" ? " tools-subnav-link--active" : ""}`}
      >
        全部工具
      </Link>
      {toolsConfig.items.map((tool) => {
        const active = pathname === tool.href;
        return (
          <Link
            key={tool.slug}
            href={tool.href}
            className={`tools-subnav-link${active ? " tools-subnav-link--active" : ""}`}
          >
            {tool.title}
          </Link>
        );
      })}
    </nav>
  );
}
