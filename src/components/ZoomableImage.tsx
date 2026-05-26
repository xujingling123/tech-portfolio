"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { ImageLightbox } from "./ImageLightbox";

type Props = {
  src: string;
  alt?: string;
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
};

export function ZoomableImage({
  src,
  alt = "",
  className = "",
  fill,
  width,
  height,
  sizes,
  priority,
}: Props) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  const buttonClass = fill
    ? `absolute inset-0 h-full w-full cursor-zoom-in border-0 bg-transparent p-0 ${className}`
    : `block w-full cursor-zoom-in border-0 bg-transparent p-0 text-left ${className}`;

  return (
    <>
      <button
        type="button"
        className={buttonClass}
        onClick={() => setOpen(true)}
        aria-label={alt ? `查看大图：${alt}` : "查看大图"}
      >
        {fill ? (
          <Image
            src={src}
            alt={alt}
            fill
            className="object-cover pointer-events-none"
            sizes={sizes}
            priority={priority}
          />
        ) : (
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            className={className}
            sizes={sizes}
            priority={priority}
          />
        )}
      </button>
      {open && <ImageLightbox src={src} alt={alt} onClose={close} />}
    </>
  );
}
