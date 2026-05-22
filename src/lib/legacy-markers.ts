import type { BinaryMarker } from "../types/drawables";

export function isLegacyVerticalMarker(marker: BinaryMarker) {
  return marker.markerType === "expiry_line";
}

export function getLegacyVerticalMarkerLabel(marker: BinaryMarker) {
  if (typeof marker.label === "string" && marker.label.trim()) {
    return marker.label.trim();
  }

  if (typeof marker.customExpiryText === "string" && marker.customExpiryText.trim()) {
    const normalized = marker.customExpiryText.trim();
    return /expiry|expiration/i.test(normalized) ? "Legacy marker" : normalized;
  }

  switch (marker.expiry) {
    case "M1":
      return "1m";
    case "M5":
      return "5m";
    case "M15":
      return "15m";
    default:
      return "Legacy marker";
  }
}
