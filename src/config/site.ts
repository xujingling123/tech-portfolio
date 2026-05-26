export const siteConfig = {
  name: "jingling",
  title: "jingling · 技术博客",
  description:
    "全栈开发 · 地图/GIS · uni-app · Flutter · 系统架构 · 前端工程化",
  author: "jingling",
  csdnUrl: "https://blog.csdn.net/jingling555",
  githubUrl: "https://github.com/jingling555",
  email: "",
  skills: [
    { name: "前端", items: ["Vue", "React", "uni-app", "TypeScript", "CSS3"] },
    { name: "地图/GIS", items: ["高德地图", "Mapbox GL", "Mars3D", "天地图"] },
    { name: "移动端", items: ["Flutter", "Android", "uni-app 热更新"] },
    { name: "后端", items: ["Spring Boot", "MySQL", "Redis"] },
    { name: "架构", items: ["系统架构师", "微服务", "软考备考"] },
  ],
  nav: [
    { href: "/", label: "首页" },
    { href: "/blog", label: "博客" },
    { href: "/about", label: "关于" },
  ],
} as const;
