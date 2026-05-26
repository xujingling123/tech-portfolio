/** CSDN 等图床会拦截 localhost Referer，本地开发需走代理 */
export function isExternalImage(src: string): boolean {
  return /^https?:\/\//i.test(src);
}

export function needsImageProxy(): boolean {
  if (typeof window === "undefined") {
    return process.env.NODE_ENV === "development";
  }
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1";
}

/** 通过本站 API 代理外链图片（仅本地开发） */
export function getProxiedImageUrl(src: string): string {
  if (!src || !isExternalImage(src)) return src;
  return `/api/image-proxy?url=${encodeURIComponent(src)}`;
}

/** 根据环境返回图片展示地址 */
export function getImageDisplayUrl(src: string): string {
  if (!src || !isExternalImage(src)) return src;
  return needsImageProxy() ? getProxiedImageUrl(src) : src;
}

/** @deprecated 使用 getImageDisplayUrl */
export function getDisplayImageUrl(src: string, _width = 1920): string {
  return getImageDisplayUrl(src);
}
