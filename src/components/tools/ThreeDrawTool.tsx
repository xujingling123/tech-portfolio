"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
  DRAW_BOARD_HEIGHT,
  DRAW_BOARD_WIDTH,
  downloadCanvasPng,
  fillBoardBackground,
  PLANE_ASPECT,
  PLANE_WORLD_WIDTH,
  strokeOnContext,
  uvToCanvasPoint,
  type DrawPoint,
} from "@/lib/three-draw/canvas";

const PRESET_COLORS = [
  "#0f172a",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#8b5cf6",
  "#ec4899",
  "#ffffff",
];

const MAX_UNDO = 30;

type InteractionMode = "draw" | "orbit";

export function ThreeDrawTool() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer;
    camera: THREE.PerspectiveCamera;
    controls: OrbitControls;
    plane: THREE.Mesh;
    texture: THREE.CanvasTexture;
    ctx: CanvasRenderingContext2D;
    frameId: number;
  } | null>(null);

  const [mode, setMode] = useState<InteractionMode>("draw");
  const [brushSize, setBrushSize] = useState(8);
  const [color, setColor] = useState("#0f172a");
  const [eraser, setEraser] = useState(false);
  const [bgColor, setBgColor] = useState("#ffffff");
  const [undoCount, setUndoCount] = useState(0);
  const [hint, setHint] = useState<string | null>(null);

  const undoStackRef = useRef<ImageData[]>([]);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<DrawPoint | null>(null);
  const modeRef = useRef(mode);
  const brushRef = useRef({ size: brushSize, color, eraser, bgColor });

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    brushRef.current = { size: brushSize, color, eraser, bgColor };
  }, [brushSize, color, eraser, bgColor]);

  const pushUndo = useCallback(() => {
    const ctx = sceneRef.current?.ctx;
    if (!ctx) return;
    const snapshot = ctx.getImageData(0, 0, DRAW_BOARD_WIDTH, DRAW_BOARD_HEIGHT);
    undoStackRef.current.push(snapshot);
    if (undoStackRef.current.length > MAX_UNDO) {
      undoStackRef.current.shift();
    }
    setUndoCount(undoStackRef.current.length);
  }, []);

  const syncTexture = useCallback(() => {
    const scene = sceneRef.current;
    if (scene) scene.texture.needsUpdate = true;
  }, []);

  const handleUndo = useCallback(() => {
    const scene = sceneRef.current;
    const prev = undoStackRef.current.pop();
    if (!scene || !prev) return;
    scene.ctx.putImageData(prev, 0, 0);
    syncTexture();
    setUndoCount(undoStackRef.current.length);
  }, [syncTexture]);

  const handleClear = useCallback(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    pushUndo();
    fillBoardBackground(scene.ctx, bgColor);
    syncTexture();
    setHint("画板已清空");
  }, [bgColor, pushUndo, syncTexture]);

  const handleExport = useCallback(() => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    downloadCanvasPng(canvas);
    setHint("已导出 PNG 图片");
  }, []);

  const applyBgColor = useCallback(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    pushUndo();
    fillBoardBackground(scene.ctx, bgColor);
    syncTexture();
    setHint("背景色已更新");
  }, [bgColor, pushUndo, syncTexture]);

  useEffect(() => {
    const container = viewportRef.current;
    if (!container) return;

    const drawCanvas = document.createElement("canvas");
    drawCanvas.width = DRAW_BOARD_WIDTH;
    drawCanvas.height = DRAW_BOARD_HEIGHT;
    drawCanvasRef.current = drawCanvas;
    const ctx = drawCanvas.getContext("2d");
    if (!ctx) return;

    fillBoardBackground(ctx, bgColor);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0f1a);

    const width = container.clientWidth || 640;
    const height = Math.min(520, Math.max(320, container.clientHeight || 480));
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.5, 5.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffffff, 0.85);
    dir.position.set(2, 4, 5);
    scene.add(dir);

    const texture = new THREE.CanvasTexture(drawCanvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const planeH = PLANE_WORLD_WIDTH / PLANE_ASPECT;
    const geometry = new THREE.PlaneGeometry(PLANE_WORLD_WIDTH, planeH);
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.92,
      metalness: 0.02,
      side: THREE.DoubleSide,
    });
    const plane = new THREE.Mesh(geometry, material);
    plane.rotation.x = -0.08;
    scene.add(plane);

    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.5,
      metalness: 0.15,
    });
    const frameDepth = 0.06;
    const frameParts = [
      [PLANE_WORLD_WIDTH + 0.12, 0.08, frameDepth],
      [PLANE_WORLD_WIDTH + 0.12, 0.08, frameDepth],
      [0.08, planeH + 0.12, frameDepth],
      [0.08, planeH + 0.12, frameDepth],
    ] as const;
    const framePos: [number, number, number][] = [
      [0, planeH / 2 + 0.04, -frameDepth / 2],
      [0, -planeH / 2 - 0.04, -frameDepth / 2],
      [-PLANE_WORLD_WIDTH / 2 - 0.04, 0, -frameDepth / 2],
      [PLANE_WORLD_WIDTH / 2 + 0.04, 0, -frameDepth / 2],
    ];
    frameParts.forEach((size, i) => {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(...size), frameMat);
      bar.position.set(...framePos[i]);
      bar.rotation.copy(plane.rotation);
      scene.add(bar);
    });

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.target.set(0, 0, 0);
    controls.minDistance = 3;
    controls.maxDistance = 10;
    controls.maxPolarAngle = Math.PI * 0.85;
    controls.enabled = false;

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const getCanvasPoint = (event: PointerEvent): DrawPoint | null => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObject(plane, false);
      if (!hits.length || !hits[0].uv) return null;
      return uvToCanvasPoint(hits[0].uv.x, hits[0].uv.y);
    };

    const onPointerDown = (event: PointerEvent) => {
      if (modeRef.current !== "draw") return;
      const point = getCanvasPoint(event);
      if (!point) return;
      pushUndo();
      drawingRef.current = true;
      lastPointRef.current = point;
      const { size, color: c, eraser: isEraser, bgColor: bg } = brushRef.current;
      strokeOnContext(ctx, point, point, {
        size,
        color: c,
        eraser: isEraser,
        backgroundColor: bg,
      });
      texture.needsUpdate = true;
      renderer.domElement.setPointerCapture(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!drawingRef.current || modeRef.current !== "draw") return;
      const point = getCanvasPoint(event);
      const last = lastPointRef.current;
      if (!point || !last) return;
      const { size, color: c, eraser: isEraser, bgColor: bg } = brushRef.current;
      strokeOnContext(ctx, last, point, {
        size,
        color: c,
        eraser: isEraser,
        backgroundColor: bg,
      });
      lastPointRef.current = point;
      texture.needsUpdate = true;
    };

    const onPointerUp = (event: PointerEvent) => {
      drawingRef.current = false;
      lastPointRef.current = null;
      try {
        renderer.domElement.releasePointerCapture(event.pointerId);
      } catch {
        /* ignore */
      }
    };

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("pointerleave", onPointerUp);

    let frameId = 0;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const ro = new ResizeObserver(() => {
      const w = container.clientWidth;
      const h = Math.min(520, Math.max(320, w * 0.65));
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    ro.observe(container);

    sceneRef.current = {
      renderer,
      camera,
      controls,
      plane,
      texture,
      ctx,
      frameId,
    };

    return () => {
      cancelAnimationFrame(frameId);
      ro.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("pointerleave", onPointerUp);
      controls.dispose();
      geometry.dispose();
      material.dispose();
      texture.dispose();
      frameMat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
      sceneRef.current = null;
      drawCanvasRef.current = null;
    };
    // 仅挂载时初始化场景；背景色通过「应用背景」按钮更新
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pushUndo]);

  useEffect(() => {
    const controls = sceneRef.current?.controls;
    if (!controls) return;
    controls.enabled = mode === "orbit";
  }, [mode]);

  return (
    <div className="tool-stack">
      <div className="tool-alert tool-alert--info">
        <p>
          基于 <strong>Three.js</strong> 的 3D 画板：在板面上绘制线条，可切换「旋转视图」调整角度，并导出
          PNG。纯浏览器运行，无需后端。
        </p>
      </div>

      <div className="tool-draw-toolbar">
        <div className="tool-draw-mode">
          <button
            type="button"
            className={`tool-draw-mode-btn${mode === "draw" ? " tool-draw-mode-btn--active" : ""}`}
            onClick={() => setMode("draw")}
          >
            绘制
          </button>
          <button
            type="button"
            className={`tool-draw-mode-btn${mode === "orbit" ? " tool-draw-mode-btn--active" : ""}`}
            onClick={() => setMode("orbit")}
          >
            旋转视图
          </button>
        </div>

        <label className="tool-field tool-draw-field-inline">
          <span className="tool-label">笔刷</span>
          <input
            type="range"
            min={2}
            max={48}
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="tool-draw-range"
          />
          <span className="tool-hint">{brushSize}px</span>
        </label>

        <div className="tool-draw-colors">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={`tool-draw-swatch${color === c && !eraser ? " tool-draw-swatch--active" : ""}`}
              style={{ background: c }}
              title={c}
              onClick={() => {
                setColor(c);
                setEraser(false);
              }}
            />
          ))}
          <input
            type="color"
            value={color}
            onChange={(e) => {
              setColor(e.target.value);
              setEraser(false);
            }}
            className="tool-draw-color-input"
            title="自定义颜色"
          />
        </div>

        <div className="tool-draw-bg">
          <label className="tool-field tool-draw-field-inline">
            <span className="tool-label">背景</span>
            <input
              type="color"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              className="tool-draw-color-input"
            />
          </label>
          <button type="button" className="btn-ghost tool-draw-mini-btn" onClick={applyBgColor}>
            应用背景
          </button>
        </div>
      </div>

      <div className="tool-actions">
        <button
          type="button"
          className={`btn-ghost${eraser ? " tool-draw-eraser-active" : ""}`}
          onClick={() => setEraser((v) => !v)}
        >
          {eraser ? "橡皮擦（开）" : "橡皮擦"}
        </button>
        <button
          type="button"
          className="btn-ghost"
          onClick={handleUndo}
          disabled={undoCount === 0}
        >
          撤销 ({undoCount})
        </button>
        <button type="button" className="btn-ghost" onClick={handleClear}>
          清空
        </button>
        <button type="button" className="btn-primary" onClick={handleExport}>
          导出 PNG
        </button>
      </div>

      {hint && <p className="tool-hint tool-hint--left">{hint}</p>}

      <p className="text-sm text-muted">
        {eraser
          ? `橡皮擦会用当前背景色（${bgColor}）覆盖笔迹；若改过背景请先点「应用背景」。`
          : mode === "draw"
            ? "在画板上按住拖动绘制；双指/滚轮缩放由旋转模式接管。"
            : "拖动旋转视角、滚轮缩放；切回「绘制」继续画画。"}
      </p>

      <div ref={viewportRef} className="tool-draw-viewport" />
    </div>
  );
}
