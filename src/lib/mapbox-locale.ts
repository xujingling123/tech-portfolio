import type { Map } from "mapbox-gl";

/** Mapbox 导航控件按钮文案（缩放、罗盘） */
const CONTROL_LABELS: Array<{ selector: string; label: string }> = [
  { selector: ".mapboxgl-ctrl-zoom-in", label: "放大" },
  { selector: ".mapboxgl-ctrl-zoom-out", label: "缩小" },
  { selector: ".mapboxgl-ctrl-compass", label: "重置方向" },
  { selector: ".mapboxgl-ctrl-geolocate", label: "定位到我的位置" },
];

/** 将 Mapbox 内置控件按钮的 title / aria-label 改为中文 */
export function localizeMapboxControls(map: Map) {
  const root = map.getContainer();
  for (const { selector, label } of CONTROL_LABELS) {
    const el = root.querySelector(selector);
    if (el instanceof HTMLElement) {
      el.setAttribute("aria-label", label);
      el.setAttribute("title", label);
    }
  }
}

export const MAPBOX_LABEL_LANGUAGE = "zh-Hans" as const;
