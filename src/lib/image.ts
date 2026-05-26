/** CSDN 等图床会拦截 localhost Referer，需走本站代理 */
export function isExternalImage(src: string): boolean {
  return /^https?:\/\//i.test(src);
}

/** 通过本站 API 代理外链图片（避免 CSDN 403） */
export function getProxiedImageUrl(src: string): string {
  if (!src || !isExternalImage(src)) return src;
  return `/api/image-proxy?url=${encodeURIComponent(src)}`;
}

/** @deprecated 使用 getProxiedImageUrl */
export function getDisplayImageUrl(src: string, _width = 1920): string {
  return getProxiedImageUrl(src);
}
