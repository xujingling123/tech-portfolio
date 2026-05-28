export type RembgModelId =
  | "u2net"
  | "u2netp"
  | "u2net_human_seg"
  | "isnet-general-use"
  | "isnet-anime"
  | "birefnet-general"
  | "birefnet-general-lite"
  | "birefnet-portrait"
  | "silueta";

export type RembgModel = {
  id: RembgModelId;
  label: string;
  hint: string;
};

/** 常用 rembg 模型（完整列表见 https://github.com/danielgatis/rembg#models） */
export const REMBG_MODELS: RembgModel[] = [
  {
    id: "u2net",
    label: "通用（u2net）",
    hint: "默认模型，适合大多数图片",
  },
  {
    id: "u2netp",
    label: "轻量（u2netp）",
    hint: "体积更小、速度更快，精度略低",
  },
  {
    id: "u2net_human_seg",
    label: "人像（u2net_human_seg）",
    hint: "针对人物分割优化",
  },
  {
    id: "isnet-general-use",
    label: "高精度通用（isnet）",
    hint: "通用场景，边缘更精细",
  },
  {
    id: "isnet-anime",
    label: "动漫（isnet-anime）",
    hint: "动漫角色抠图",
  },
  {
    id: "birefnet-general",
    label: "BiRefNet 通用",
    hint: "较新的通用模型，效果较好",
  },
  {
    id: "birefnet-general-lite",
    label: "BiRefNet 轻量",
    hint: "BiRefNet 轻量版",
  },
  {
    id: "birefnet-portrait",
    label: "BiRefNet 人像",
    hint: "人像专用",
  },
  {
    id: "silueta",
    label: "Silueta（43MB）",
    hint: "u2net 精简版",
  },
];

const MODEL_IDS = new Set(REMBG_MODELS.map((m) => m.id));

export function isRembgModelId(value: string): value is RembgModelId {
  return MODEL_IDS.has(value as RembgModelId);
}

export const DEFAULT_REMBG_MODEL: RembgModelId = "u2netp";
