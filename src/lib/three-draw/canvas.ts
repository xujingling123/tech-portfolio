/** 画板纹理分辨率 */
export const DRAW_BOARD_WIDTH = 1024;
export const DRAW_BOARD_HEIGHT = 768;

/** 3D 场景中画板物理宽度（高度按比例） */
export const PLANE_ASPECT = DRAW_BOARD_WIDTH / DRAW_BOARD_HEIGHT;
export const PLANE_WORLD_WIDTH = 4;

export type DrawPoint = { x: number; y: number };

export type DrawStrokeOptions = {
  size: number;
  color: string;
  eraser: boolean;
  /** 橡皮擦时用背景色覆盖笔迹（Canvas 贴图不透明时比 destination-out 可靠） */
  backgroundColor: string;
};

export function strokeOnContext(
  ctx: CanvasRenderingContext2D,
  from: DrawPoint,
  to: DrawPoint,
  options: DrawStrokeOptions
) {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = options.size;
  ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = options.eraser ? options.backgroundColor : options.color;
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
}

export function uvToCanvasPoint(
  u: number,
  v: number,
  width = DRAW_BOARD_WIDTH,
  height = DRAW_BOARD_HEIGHT
): DrawPoint {
  return {
    x: Math.round(u * width),
    y: Math.round((1 - v) * height),
  };
}

export function fillBoardBackground(
  ctx: CanvasRenderingContext2D,
  color: string,
  width = DRAW_BOARD_WIDTH,
  height = DRAW_BOARD_HEIGHT
) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);
}

export function downloadCanvasPng(
  canvas: HTMLCanvasElement,
  filename = `three-draw-${Date.now()}.png`
) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  link.click();
}
