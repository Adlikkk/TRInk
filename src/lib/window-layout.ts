import type { DesktopBounds } from "./monitor-utils";
import {
  TOOLBAR_MARGIN,
  TOOLBAR_WINDOW_BASIC_COMPACT_NOTICE_SIZE,
  TOOLBAR_WINDOW_BASIC_COMPACT_SIZE,
  TOOLBAR_WINDOW_BASIC_NORMAL_NOTICE_SIZE,
  TOOLBAR_WINDOW_BASIC_NORMAL_SIZE,
  TOOLBAR_WINDOW_COMPACT_SIZE,
  TOOLBAR_WINDOW_COMPACT_NOTICE_SIZE,
  TOOLBAR_WINDOW_NORMAL_SIZE,
  TOOLBAR_WINDOW_NORMAL_NOTICE_SIZE,
  TOOLBAR_WINDOW_STARTUP_SIZE,
  type ToolbarWindowSize
} from "./ui-constants";
import type { ToolbarSizeMode, ToolbarPosition } from "../types/settings";
import type { AppEditionId } from "../editions/edition";

export type ToolbarWindowState =
  | "compact"
  | "compact-notice"
  | "normal"
  | "normal-notice"
  | "startup";

export function getToolbarWindowSize(
  toolbarSize: ToolbarSizeMode,
  state: ToolbarWindowState,
  editionId: AppEditionId = "trading"
): ToolbarWindowSize {
  if (editionId === "basic") {
    switch (state) {
      case "startup":
        return TOOLBAR_WINDOW_STARTUP_SIZE;
      case "compact-notice":
        return TOOLBAR_WINDOW_BASIC_COMPACT_NOTICE_SIZE;
      case "normal-notice":
        return TOOLBAR_WINDOW_BASIC_NORMAL_NOTICE_SIZE;
      case "normal":
        return TOOLBAR_WINDOW_BASIC_NORMAL_SIZE;
      case "compact":
      default:
        return toolbarSize === "normal" ? TOOLBAR_WINDOW_BASIC_NORMAL_SIZE : TOOLBAR_WINDOW_BASIC_COMPACT_SIZE;
    }
  }

  switch (state) {
    case "startup":
      return TOOLBAR_WINDOW_STARTUP_SIZE;
    case "compact-notice":
      return TOOLBAR_WINDOW_COMPACT_NOTICE_SIZE;
    case "normal-notice":
      return TOOLBAR_WINDOW_NORMAL_NOTICE_SIZE;
    case "normal":
      return TOOLBAR_WINDOW_NORMAL_SIZE;
    case "compact":
    default:
      return toolbarSize === "normal" ? TOOLBAR_WINDOW_NORMAL_SIZE : TOOLBAR_WINDOW_COMPACT_SIZE;
  }
}

export function clampWindowPositionToDesktop(
  position: Partial<ToolbarPosition> | undefined,
  bounds: DesktopBounds,
  size: ToolbarWindowSize,
  fallback: ToolbarPosition
): ToolbarPosition {
  const minX = bounds.x + TOOLBAR_MARGIN;
  const minY = bounds.y + TOOLBAR_MARGIN;
  const maxX = Math.max(minX, bounds.x + bounds.width - size.width - TOOLBAR_MARGIN);
  const maxY = Math.max(minY, bounds.y + bounds.height - size.height - TOOLBAR_MARGIN);

  const x = typeof position?.x === "number" && Number.isFinite(position.x) ? position.x : fallback.x;
  const y = typeof position?.y === "number" && Number.isFinite(position.y) ? position.y : fallback.y;

  return {
    x: Math.min(maxX, Math.max(minX, x)),
    y: Math.min(maxY, Math.max(minY, y))
  };
}
