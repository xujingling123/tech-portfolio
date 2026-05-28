import { REMBG_MAX_IMAGE_SIDE } from "./config";

export type PreparedImage = {
  file: File;
  wasResized: boolean;
  hint?: string;
};

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("无法读取图片"));
    img.src = url;
  });
}

/**
 * 浏览器端缩小过大图片，减轻 rembg CPU 压力、缩短等待时间
 */
export async function prepareImageForRembg(
  file: File,
  maxSide = REMBG_MAX_IMAGE_SIDE
): Promise<PreparedImage> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const { width, height } = img;
    const longest = Math.max(width, height);

    if (longest <= maxSide) {
      return { file, wasResized: false };
    }

    const scale = maxSide / longest;
    const targetW = Math.round(width * scale);
    const targetH = Math.round(height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return { file, wasResized: false };
    }
    ctx.drawImage(img, 0, 0, targetW, targetH);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("图片压缩失败"))),
        "image/jpeg",
        0.92
      );
    });

    const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
    const outFile = new File([blob], `${baseName}-prep.jpg`, {
      type: "image/jpeg",
    });

    return {
      file: outFile,
      wasResized: true,
      hint: `原图 ${width}×${height}，已缩放为 ${targetW}×${targetH} 以加快抠图。`,
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}
