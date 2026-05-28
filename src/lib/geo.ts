export type LngLat = { lng: number; lat: number };

const LNG_MIN = -180;
const LNG_MAX = 180;
const LAT_MIN = -90;
const LAT_MAX = 90;

export function parseCoordinate(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n)) return null;
  return n;
}

export function validateLngLat(lng: number, lat: number): string | null {
  if (lng < LNG_MIN || lng > LNG_MAX) {
    return `经度需在 ${LNG_MIN}～${LNG_MAX} 之间`;
  }
  if (lat < LAT_MIN || lat > LAT_MAX) {
    return `纬度需在 ${LAT_MIN}～${LAT_MAX} 之间`;
  }
  return null;
}

export function formatLngLat({ lng, lat }: LngLat, fractionDigits = 6): string {
  return `${lng.toFixed(fractionDigits)}, ${lat.toFixed(fractionDigits)}`;
}

export const DEFAULT_CENTER: LngLat = { lng: 116.397428, lat: 39.90923 };
