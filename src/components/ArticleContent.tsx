"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getProxiedImageUrl, isExternalImage } from "@/lib/image";
import { ImageLightbox } from "./ImageLightbox";

type LightboxState = { src: string; alt: string } | null;

function detectLanguage(pre: HTMLPreElement): string | null {
  const code = pre.querySelector("code");
  if (!code) return null;
  const className = code.className || pre.className;
  const langMatch = className.match(/language-([\w+#-]+)/i);
  if (langMatch) return langMatch[1];
  const hljsMatch = className.match(
    /\b(hljs-)?(javascript|typescript|python|java|xml|html|css|json|bash|shell|sql|go|rust|c|cpp)\b/i,
  );
  return hljsMatch?.[2] ?? null;
}

function getCodeText(pre: HTMLPreElement): string {
  const code = pre.querySelector("code");
  return (code?.textContent ?? pre.textContent ?? "").replace(/\n$/, "");
}

function enhanceCodeBlocks(articleRoot: HTMLElement) {
  const pres = articleRoot.querySelectorAll<HTMLPreElement>(
    "pre:not(.code-block-enhanced)",
  );

  pres.forEach((pre) => {
    if (pre.closest(".code-block-wrapper")) return;

    pre.classList.add("code-block-enhanced");

    const wrapper = document.createElement("div");
    wrapper.className = "code-block-wrapper";

    const header = document.createElement("div");
    header.className = "code-block-header";

    const lang = detectLanguage(pre);
    if (lang) {
      const label = document.createElement("span");
      label.className = "code-block-lang";
      label.textContent = lang;
      header.appendChild(label);
    } else {
      header.appendChild(document.createElement("span"));
    }

    const copyBtn = document.createElement("button");
    copyBtn.type = "button";
    copyBtn.className = "code-copy-btn";
    copyBtn.setAttribute("aria-label", "复制代码");
    copyBtn.textContent = "复制";

    copyBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const text = getCodeText(pre);
      try {
        await navigator.clipboard.writeText(text);
        copyBtn.textContent = "已复制";
        copyBtn.classList.add("code-copy-btn--success");
        setTimeout(() => {
          copyBtn.textContent = "复制";
          copyBtn.classList.remove("code-copy-btn--success");
        }, 2000);
      } catch {
        copyBtn.textContent = "复制失败";
        setTimeout(() => {
          copyBtn.textContent = "复制";
        }, 2000);
      }
    });

    header.appendChild(copyBtn);

    const parent = pre.parentNode;
    if (!parent) return;

    parent.insertBefore(wrapper, pre);
    wrapper.appendChild(header);
    wrapper.appendChild(pre);
  });
}

function markZoomableImages(articleRoot: HTMLElement) {
  articleRoot.querySelectorAll<HTMLImageElement>("img").forEach((img) => {
    img.classList.add("article-image-zoomable");

    const raw = img.getAttribute("src");
    if (raw && isExternalImage(raw)) {
      img.dataset.originalSrc = raw;
      img.src = getProxiedImageUrl(raw);
    }

    if (!img.alt) img.alt = "文章配图";
  });
}

function resolveOriginalSrc(img: HTMLImageElement): string | null {
  const fromData = img.dataset.originalSrc;
  if (fromData && isExternalImage(fromData)) return fromData;

  const attr = img.getAttribute("src");
  if (attr && isExternalImage(attr)) return attr;

  const src = img.src;
  if (src && isExternalImage(src) && !src.includes("/api/image-proxy")) {
    return src;
  }

  if (src?.includes("/api/image-proxy")) {
    try {
      const u = new URL(src, window.location.origin);
      const original = u.searchParams.get("url");
      if (original) return original;
    } catch {
      /* ignore */
    }
  }

  return null;
}

export function ArticleContent({ html }: { html: string }) {
  const articleRef = useRef<HTMLDivElement>(null);
  const [lightbox, setLightbox] = useState<LightboxState>(null);

  const openLightbox = useCallback((src: string, alt: string) => {
    setLightbox({ src, alt });
  }, []);

  const closeLightbox = useCallback(() => setLightbox(null), []);

  useEffect(() => {
    const root = articleRef.current;
    if (!root) return;

    root.innerHTML = html;
    enhanceCodeBlocks(root);
    markZoomableImages(root);
  }, [html]);

  useEffect(() => {
    const root = articleRef.current;
    if (!root) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target;
      if (!(target instanceof HTMLImageElement)) return;
      if (!root.contains(target)) return;

      const originalSrc = resolveOriginalSrc(target);
      if (!originalSrc) return;

      e.preventDefault();
      e.stopPropagation();
      openLightbox(originalSrc, target.alt || "文章配图");
    };

    root.addEventListener("click", handleClick, true);

    return () => {
      root.removeEventListener("click", handleClick, true);
    };
  }, [html, openLightbox]);

  return (
    <>
      <div ref={articleRef} className="article-body" />
      {lightbox && (
        <ImageLightbox
          src={lightbox.src}
          alt={lightbox.alt}
          onClose={closeLightbox}
        />
      )}
    </>
  );
}
