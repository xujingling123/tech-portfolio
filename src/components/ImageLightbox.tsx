"use client";

import { useEffect, useState } from "react";
import { getImageDisplayUrl } from "@/lib/image";

type Props = {
  /** 原始图片地址 */
  src: string;
  alt: string;
  onClose: () => void;
};

export function ImageLightbox({ src, alt, onClose }: Props) {
  const displaySrc = getImageDisplayUrl(src);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  return (
    <div
      className="image-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="查看大图"
      onClick={onClose}
    >
      <button
        type="button"
        className="image-lightbox-close"
        aria-label="关闭"
        onClick={onClose}
      >
        ✕
      </button>
      <div
        className="image-lightbox-content"
        onClick={(e) => e.stopPropagation()}
      >
        {failed ? (
          <div className="image-lightbox-error">
            <p>图片加载失败</p>
            <a
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              className="image-lightbox-error-link"
            >
              在新标签页打开原图
            </a>
          </div>
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={displaySrc}
            alt={alt || "文章配图"}
            className="image-lightbox-img"
            referrerPolicy="no-referrer"
            onError={() => setFailed(true)}
          />
        )}
        {alt && !failed && (
          <p className="image-lightbox-caption">{alt}</p>
        )}
      </div>
    </div>
  );
}
