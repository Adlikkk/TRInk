import { DEFAULT_SETTINGS, type AppSettings } from "../types/settings";
import type { ToolbarPosition } from "../types/settings";
import { isToolKind, TOOL_DEFINITIONS } from "./tool-definitions";
import { TOOLBAR_ESTIMATED_HEIGHT, TOOLBAR_MARGIN, TOOLBAR_WIDTH } from "./ui-constants";

const SETTINGS_KEY = "trink.settings.v0.1";

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, value));
}

export function clampToolbarPosition(
  position: Partial<ToolbarPosition> | undefined,
  viewport = {
    width: typeof window !== "undefined" ? window.innerWidth : 1920,
    height: typeof window !== "undefined" ? window.innerHeight : 1080
  }
): ToolbarPosition {
  const maxX = Math.max(TOOLBAR_MARGIN, viewport.width - TOOLBAR_WIDTH - TOOLBAR_MARGIN);
  const maxY = Math.max(TOOLBAR_MARGIN, viewport.height - TOOLBAR_ESTIMATED_HEIGHT - TOOLBAR_MARGIN);

  return {
    x: clampNumber(position?.x, TOOLBAR_MARGIN, maxX, DEFAULT_SETTINGS.toolbarPosition.x),
    y: clampNumber(position?.y, TOOLBAR_MARGIN, maxY, DEFAULT_SETTINGS.toolbarPosition.y)
  };
}

export function normalizeSettings(input: unknown): AppSettings {
  const parsed = input && typeof input === "object" ? (input as Partial<AppSettings>) : {};
  const validFavorites = Array.isArray(parsed.favoriteTools)
    ? parsed.favoriteTools.filter(isToolKind)
    : [];
  const favoriteTools = [...new Set(validFavorites)].slice(0, 8);
  const modeOptions = new Set(["basic", "trading", "binary"] as const);
  const overlayModeOptions = new Set(["draw", "click-through"] as const);

  return {
    settingsVersion: DEFAULT_SETTINGS.settingsVersion,
    defaultColor:
      typeof parsed.defaultColor === "string" && parsed.defaultColor.trim()
        ? parsed.defaultColor
        : DEFAULT_SETTINGS.defaultColor,
    strokeWidth: clampNumber(parsed.strokeWidth, 1, 12, DEFAULT_SETTINGS.strokeWidth),
    opacity: clampNumber(parsed.opacity, 0.1, 1, DEFAULT_SETTINGS.opacity),
    defaultMode: overlayModeOptions.has(parsed.defaultMode as AppSettings["defaultMode"])
      ? (parsed.defaultMode as AppSettings["defaultMode"])
      : DEFAULT_SETTINGS.defaultMode,
    toolbarOpacity: clampNumber(parsed.toolbarOpacity, 0.35, 1, DEFAULT_SETTINGS.toolbarOpacity),
    favoriteTools:
      favoriteTools.length > 0
        ? favoriteTools
        : DEFAULT_SETTINGS.favoriteTools.filter((tool) => TOOL_DEFINITIONS.some((entry) => entry.id === tool)),
    defaultTool: isToolKind(parsed.defaultTool) ? parsed.defaultTool : DEFAULT_SETTINGS.defaultTool,
    toolMode: modeOptions.has(parsed.toolMode as AppSettings["toolMode"])
      ? (parsed.toolMode as AppSettings["toolMode"])
      : DEFAULT_SETTINGS.toolMode,
    startMinimized: Boolean(parsed.startMinimized),
    alwaysOnTop: typeof parsed.alwaysOnTop === "boolean" ? parsed.alwaysOnTop : DEFAULT_SETTINGS.alwaysOnTop,
    toolbarPosition: clampToolbarPosition(parsed.toolbarPosition)
  };
}

export function loadSettings(): AppSettings {
  if (typeof window === "undefined") {
    return DEFAULT_SETTINGS;
  }

  let raw: string | null = null;

  try {
    raw = window.localStorage.getItem(SETTINGS_KEY);
  } catch {
    return DEFAULT_SETTINGS;
  }

  if (!raw) {
    return DEFAULT_SETTINGS;
  }

  try {
    return normalizeSettings(JSON.parse(raw));
  } catch {
    try {
      window.localStorage.removeItem(SETTINGS_KEY);
    } catch {
      // Ignore localStorage cleanup failures.
    }
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(normalizeSettings(settings)));
  } catch {
    // Ignore local persistence failures to keep the overlay usable.
  }
}
