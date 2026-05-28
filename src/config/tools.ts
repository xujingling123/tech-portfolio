export type ToolItem = {
  slug: string;
  title: string;
  description: string;
  icon: string;
  href: string;
  tags: string[];
  requiresEnv?: string[];
};

export const toolsConfig = {
  title: "在线工具",
  description:
    "实用小工具集合：地图经纬度定位、声音复刻合成、一键抠图等，可在浏览器中直接使用。",
  items: [
    {
      slug: "map",
      title: "地图定位",
      description:
        "基于 Mapbox，输入或通过地图点击选取经纬度，在地图上标注并定位到该位置。",
      icon: "◎",
      href: "/tools/map",
      tags: ["Mapbox", "GIS", "经纬度"],
      requiresEnv: ["NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN"],
    },
    {
      slug: "voice-clone",
      title: "声音复刻合成",
      description:
        "支持阿里云百炼（推荐）或 MiniMax：自备 API Key，上传参考人声与文本，复刻并下载音频。",
      icon: "♪",
      href: "/tools/voice-clone",
      tags: ["阿里云", "MiniMax", "声音克隆"],
    },
    {
      slug: "rembg",
      title: "一键抠图",
      description:
        "基于 rembg 开源 AI 模型，上传图片去除背景，支持多种模型与人像/动漫场景。",
      icon: "◫",
      href: "/tools/rembg",
      tags: ["rembg", "抠图", "背景移除"],
      requiresEnv: ["REMBG_SERVER_URL"],
    },
  ] satisfies ToolItem[],
} as const;
