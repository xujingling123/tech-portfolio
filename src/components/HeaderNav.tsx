"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/config/site";

export function HeaderNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1">
      {siteConfig.nav.map((item) => {
        const active =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-link ${active ? "nav-link--active" : ""}`}
          >
            {item.label}
          </Link>
        );
      })}
      <a
        href={siteConfig.csdnUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="nav-link-external hidden sm:inline-flex"
      >
        CSDN
      </a>
    </nav>
  );
}
