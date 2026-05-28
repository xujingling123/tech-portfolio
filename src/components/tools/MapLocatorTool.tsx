"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import {
  DEFAULT_CENTER,
  formatLngLat,
  parseCoordinate,
  validateLngLat,
} from "@/lib/geo";
import {
  localizeMapboxControls,
  MAPBOX_LABEL_LANGUAGE,
} from "@/lib/mapbox-locale";
import MapboxLanguage from "@mapbox/mapbox-gl-language";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim();

function mapStyle(theme: string | undefined) {
  return theme === "light"
    ? "mapbox://styles/mapbox/light-v11"
    : "mapbox://styles/mapbox/dark-v11";
}

export function MapLocatorTool() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("mapbox-gl").Map | null>(null);
  const markerRef = useRef<import("mapbox-gl").Marker | null>(null);
  const { resolvedTheme } = useTheme();

  const [lngInput, setLngInput] = useState(String(DEFAULT_CENTER.lng));
  const [latInput, setLatInput] = useState(String(DEFAULT_CENTER.lat));
  const [zoomInput, setZoomInput] = useState("14");
  const [error, setError] = useState<string | null>(null);
  const [coordLabel, setCoordLabel] = useState(formatLngLat(DEFAULT_CENTER));

  const syncMarker = useCallback((lng: number, lat: number, fly: boolean) => {
    setLngInput(String(lng));
    setLatInput(String(lat));
    setCoordLabel(formatLngLat({ lng, lat }));
    setError(null);

    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;

    marker.setLngLat([lng, lat]);
    const zoom = Math.min(20, Math.max(1, Number(zoomInput) || 14));

    if (fly) {
      map.flyTo({ center: [lng, lat], zoom, essential: true });
    } else {
      map.setCenter([lng, lat]);
    }
  }, [zoomInput]);

  useEffect(() => {
    if (!MAPBOX_TOKEN || !mapContainerRef.current || mapRef.current) return;

    let cancelled = false;

    void import("mapbox-gl").then((mod) => {
      if (cancelled || !mapContainerRef.current) return;

      const mapboxgl = mod.default;
      mapboxgl.accessToken = MAPBOX_TOKEN;

      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: mapStyle(resolvedTheme),
        center: [DEFAULT_CENTER.lng, DEFAULT_CENTER.lat],
        zoom: 11,
      });

      map.addControl(new mapboxgl.NavigationControl(), "top-right");
      map.addControl(
        new mapboxgl.ScaleControl({ maxWidth: 100, unit: "metric" }),
        "bottom-left"
      );
      // 地图标注汉化：使用矢量瓦片 name_zh-Hans 字段
      map.addControl(
        new MapboxLanguage({ defaultLanguage: MAPBOX_LABEL_LANGUAGE })
      );

      const refreshControlLabels = () => localizeMapboxControls(map);
      map.on("load", refreshControlLabels);
      map.on("style.load", () => queueMicrotask(refreshControlLabels));

      const marker = new mapboxgl.Marker({ draggable: true, color: "#06b6d4" })
        .setLngLat([DEFAULT_CENTER.lng, DEFAULT_CENTER.lat])
        .addTo(map);

      marker.on("dragend", () => {
        const { lng, lat } = marker.getLngLat();
        setLngInput(String(lng));
        setLatInput(String(lat));
        setCoordLabel(formatLngLat({ lng, lat }));
        setError(null);
      });

      map.on("click", (e) => {
        const { lng, lat } = e.lngLat;
        marker.setLngLat([lng, lat]);
        setLngInput(String(lng));
        setLatInput(String(lat));
        setCoordLabel(formatLngLat({ lng, lat }));
        setError(null);
      });

      mapRef.current = map;
      markerRef.current = marker;
    });

    return () => {
      cancelled = true;
      markerRef.current?.remove();
      mapRef.current?.remove();
      markerRef.current = null;
      mapRef.current = null;
    };
    // 仅初始化一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setStyle(mapStyle(resolvedTheme));
  }, [resolvedTheme]);

  const handleLocate = () => {
    const lng = parseCoordinate(lngInput);
    const lat = parseCoordinate(latInput);
    if (lng === null || lat === null) {
      setError("请输入有效的数字经纬度");
      return;
    }
    const validation = validateLngLat(lng, lat);
    if (validation) {
      setError(validation);
      return;
    }
    syncMarker(lng, lat, true);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("当前浏览器不支持定位");
      return;
    }
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        syncMarker(pos.coords.longitude, pos.coords.latitude, true);
      },
      () => setError("无法获取当前位置，请检查浏览器定位权限"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  if (!MAPBOX_TOKEN) {
    return (
      <div className="tool-alert">
        <p className="font-medium text-heading">需要配置 Mapbox Token</p>
        <p className="mt-2 text-sm text-muted">
          在项目根目录创建 <code className="inline-code">.env.local</code>，并添加：
        </p>
        <pre className="tool-code-block mt-3">
          NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.你的_mapbox_token
        </pre>
        <p className="mt-3 text-sm text-muted">
          可在{" "}
          <a
            href="https://account.mapbox.com/access-tokens/"
            target="_blank"
            rel="noopener noreferrer"
            className="link-accent"
          >
            Mapbox 控制台
          </a>{" "}
          免费申请 Public Token。
        </p>
      </div>
    );
  }

  return (
    <div className="tool-stack">
      <div className="tool-form-grid">
        <label className="tool-field">
          <span className="tool-label">经度 (Lng)</span>
          <input
            type="text"
            inputMode="decimal"
            className="tool-input"
            value={lngInput}
            onChange={(e) => setLngInput(e.target.value)}
            placeholder="例如 116.397428"
          />
        </label>
        <label className="tool-field">
          <span className="tool-label">纬度 (Lat)</span>
          <input
            type="text"
            inputMode="decimal"
            className="tool-input"
            value={latInput}
            onChange={(e) => setLatInput(e.target.value)}
            placeholder="例如 39.90923"
          />
        </label>
        <label className="tool-field">
          <span className="tool-label">缩放级别</span>
          <input
            type="number"
            min={1}
            max={20}
            className="tool-input"
            value={zoomInput}
            onChange={(e) => setZoomInput(e.target.value)}
          />
        </label>
      </div>

      {error && <p className="tool-error">{error}</p>}

      <div className="tool-actions">
        <button type="button" className="btn-primary" onClick={handleLocate}>
          定位到坐标
        </button>
        <button type="button" className="btn-ghost" onClick={handleUseCurrentLocation}>
          使用当前位置
        </button>
      </div>

      <p className="text-sm text-muted">
        当前坐标：<span className="font-mono text-accent">{coordLabel}</span>
        <span className="text-faint"> · 点击地图或拖动标记可更新位置</span>
      </p>

      <div
        ref={mapContainerRef}
        className="tool-map"
        role="application"
        aria-label="中文标注地图"
      />
    </div>
  );
}
