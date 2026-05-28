import { NextResponse } from "next/server";
import { RembgServiceError, rembgErrorToHttpStatus } from "@/lib/rembg/errors";
import { DEFAULT_REMBG_MODEL, isRembgModelId } from "@/lib/rembg/models";
import { removeBackground } from "@/lib/rembg/remove";

export const runtime = "nodejs";
/** 本地/部署允许长耗时（首次下载模型 + CPU 推理） */
export const maxDuration = 600;

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/bmp",
  "image/gif",
  "image/x-png",
]);

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const image = form.get("image");
    const model = String(form.get("model") ?? DEFAULT_REMBG_MODEL).trim();
    const alphaMatting = String(form.get("alphaMatting") ?? "") === "true";
    const onlyMask = String(form.get("onlyMask") ?? "") === "true";

    if (!(image instanceof File)) {
      return NextResponse.json({ error: "请上传图片文件" }, { status: 400 });
    }

    if (!isRembgModelId(model)) {
      return NextResponse.json({ error: "不支持的 rembg 模型" }, { status: 400 });
    }

    if (image.size > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { error: "图片不能超过 10MB" },
        { status: 400 }
      );
    }

    const type = image.type || "application/octet-stream";
    if (
      type !== "application/octet-stream" &&
      !ALLOWED_IMAGE_TYPES.has(type)
    ) {
      return NextResponse.json(
        { error: "仅支持 JPG、PNG、WebP、BMP、GIF 等常见图片格式" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await image.arrayBuffer());
    const output = await removeBackground({
      buffer,
      fileName: image.name || "input.png",
      mimeType: type === "application/octet-stream" ? "image/png" : type,
      model,
      alphaMatting,
      onlyMask,
    });

    const baseName =
      image.name.replace(/\.[^.]+$/, "") || "image";

    return new NextResponse(new Uint8Array(output), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="${baseName}-nobg.png"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    if (err instanceof RembgServiceError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: rembgErrorToHttpStatus(err) }
      );
    }

    console.error("[rembg/remove]", err);
    return NextResponse.json(
      { error: "服务器处理失败，请稍后重试" },
      { status: 500 }
    );
  }
}
