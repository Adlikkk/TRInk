import { DEFAULT_SETTINGS, type AppSettings } from "../types/settings";
import type { ToolbarPosition } from "../types/settings";
import { normalizeShortcutBindings } from "./shortcuts";
import {
  DEFAULT_FAVORITE_TOOLS,
  canFavoriteTool,
  isToolKind,
  isUserFacingTool,
  normalizeFavoriteTools,
  registerRecentTool,
  TOOL_DEFINITIONS
} from "./tool-definitions";
import {
  TIMER_MARGIN,
  TIMER_SIZE_COMPACT,
  TIMER_SIZE_NORMAL,
  TOOLBAR_MARGIN,
  TOOLBAR_WINDOW_COMPACT_SIZE
} from "./ui-constants";

const SETTINGS_KEY = "trink.settings.v0.1";

type ToolbarViewport = {
  x?: number;
  y?: number;
  width: number;
  height: number;
};

type OverlayViewport = {
  width: number;
  height: number;
};

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, value));
}

export function clampToolbarPosition(
  position: Partial<ToolbarPosition> | undefined,
  viewport: ToolbarViewport = {
    x: 0,
    y: 0,
    width: typeof window !== "undefined" ? window.screen.availWidth : 1920,
    height: typeof window !== "undefined" ? window.screen.availHeight : 1080
  },
  toolbarSize = TOOLBAR_WINDOW_COMPACT_SIZE
): ToolbarPosition {
  const originX = viewport.x ?? 0;
  const originY = viewport.y ?? 0;
  const width = toolbarSize.width;
  const height = toolbarSize.height;
  const minX = originX + TOOLBAR_MARGIN;
  const minY = originY + TOOLBAR_MARGIN;
  const maxX = Math.max(minX, originX + viewport.width - width - TOOLBAR_MARGIN);
  const maxY = Math.max(minY, originY + viewport.height - height - TOOLBAR_MARGIN);

  return {
    x: clampNumber(position?.x, minX, maxX, DEFAULT_SETTINGS.toolbarPosition.x),
    y: clampNumber(position?.y, minY, maxY, DEFAULT_SETTINGS.toolbarPosition.y)
  };
}

export function clampTimerPosition(
  position: Partial<ToolbarPosition> | undefined,
  viewport: OverlayViewport = {
    width: typeof window !== "undefined" ? window.innerWidth : 1920,
    height: typeof window !== "undefined" ? window.innerHeight : 1080
  },
  timerSize = TIMER_SIZE_COMPACT
): ToolbarPosition {
  const minX = TIMER_MARGIN;
  const minY = TIMER_MARGIN;
  const maxX = Math.max(minX, viewport.width - timerSize.width - TIMER_MARGIN);
  const maxY = Math.max(minY, viewport.height - timerSize.height - TIMER_MARGIN);

  return {
    x: clampNumber(position?.x, minX, maxX, DEFAULT_SETTINGS.timerPosition.x),
    y: clampNumber(position?.y, minY, maxY, DEFAULT_SETTINGS.timerPosition.y)
  };
}

export function normalizeSettings(input: unknown): AppSettings {
  const parsed = input && typeof input === "object" ? (input as Partial<AppSettings>) : {};
  const favoriteTools = Array.isArray(parsed.favoriteTools)
    ? normalizeFavoriteTools(parsed.favoriteTools)
    : [];
  const recentTools = Array.isArray(parsed.recentTools)
    ? parsed.recentTools.filter(isToolKind).filter(isUserFacingTool).slice(0, 5)
    : [];
  const modeOptions = new Set(["basic", "trading", "binary"] as const);
  const overlayModeOptions = new Set(["draw", "click-through"] as const);
  const toolbarSizeOptions = new Set(["compact", "normal"] as const);
  const timerSizeOptions = new Set(["compact", "normal"] as const);
  const timerPresetOptions = new Set(["1m", "5m", "15m", "custom"] as const);
  const drawingTarget =
    typeof parsed.drawingTargetMonitor === "string" &&
    (parsed.drawingTargetMonitor === "auto" || /^monitor-\d+$/.test(parsed.drawingTargetMonitor))
      ? parsed.drawingTargetMonitor
      : DEFAULT_SETTINGS.drawingTargetMonitor;
  const timerSize =
    timerSizeOptions.has(parsed.timerSize as AppSettings["timerSize"])
      ? (parsed.timerSize as AppSettings["timerSize"])
      : DEFAULT_SETTINGS.timerSize;
  const timerDurationMs = clampNumber(parsed.timerDurationMs, 1_000, 86_400_000, DEFAULT_SETTINGS.timerDurationMs);
  const shortcuts = normalizeShortcutBindings(parsed.shortcuts);

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
    toolbarSize: toolbarSizeOptions.has(parsed.toolbarSize as AppSettings["toolbarSize"])
      ? (parsed.toolbarSize as AppSettings["toolbarSize"])
      : DEFAULT_SETTINGS.toolbarSize,
    favoriteTools:
      favoriteTools.length > 0
        ? favoriteTools
        : normalizeFavoriteTools(DEFAULT_FAVORITE_TOOLS),
    defaultTool:
      isToolKind(parsed.defaultTool) && TOOL_DEFINITIONS.some((tool) => tool.id === parsed.defaultTool)
        ? parsed.defaultTool
        : DEFAULT_SETTINGS.defaultTool,
    toolMode: modeOptions.has(parsed.toolMode as AppSettings["toolMode"])
      ? (parsed.toolMode as AppSettings["toolMode"])
      : DEFAULT_SETTINGS.toolMode,
    startMinimized: Boolean(parsed.startMinimized),
    alwaysOnTop: typeof parsed.alwaysOnTop === "boolean" ? parsed.alwaysOnTop : DEFAULT_SETTINGS.alwaysOnTop,
    toolbarPosition: clampToolbarPosition(parsed.toolbarPosition),
    drawingTargetMonitor: drawingTarget,
    showCursorHints:
      typeof parsed.showCursorHints === "boolean"
        ? parsed.showCursorHints
        : DEFAULT_SETTINGS.showCursorHints,
    showPatternLabels:
      typeof parsed.showPatternLabels === "boolean"
        ? parsed.showPatternLabels
        : DEFAULT_SETTINGS.showPatternLabels,
    timerVisible: typeof parsed.timerVisible === "boolean" ? parsed.timerVisible : DEFAULT_SETTINGS.timerVisible,
    timerPosition: clampTimerPosition(
      parsed.timerPosition,
      undefined,
      timerSize === "compact" ? TIMER_SIZE_COMPACT : TIMER_SIZE_NORMAL
    ),
    timerDurationMs,
    timerPreset: timerPresetOptions.has(parsed.timerPreset as AppSettings["timerPreset"])
      ? (parsed.timerPreset as AppSettings["timerPreset"])
      : DEFAULT_SETTINGS.timerPreset,
    timerSize,
    timerOpacity: clampNumber(parsed.timerOpacity, 0.35, 1, DEFAULT_SETTINGS.timerOpacity),
    recentTools,
    shortcuts,
    welcomeDismissed:
      typeof parsed.welcomeDismissed === "boolean"
        ? parsed.welcomeDismissed
        : DEFAULT_SETTINGS.welcomeDismissed
  };
}

export function addRecentTool(settings: AppSettings, tool: AppSettings["defaultTool"]) {
  return {
    ...settings,
    recentTools: registerRecentTool(settings.recentTools, tool)
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
