import {
  Pointer,
  Minus,
  ArrowUpRight,
  SeparatorVertical,
  Eraser,
  Highlighter,
  Pen,
  RectangleHorizontal,
  Redo2,
  Trash2,
  Undo2,
  Type,
  Eye,
  EyeOff,
  MoveUpRight,
  Columns2,
  Layers3,
  Orbit,
  Radar,
  Combine,
  GitCompareArrows,
  PanelTop,
  Waves,
  ScanLine,
  GitFork,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ToolKind, ToolMode } from "../types/drawables";

export type ToolCategory = "basic" | "chart" | "price-action" | "binary-utility";

export type ToolDefinition = {
  id: ToolKind;
  label: string;
  mode: ToolMode;
  category: ToolCategory;
  icon: LucideIcon;
  description: string;
  shortcut?: string;
  favoritable: boolean;
  legacy?: boolean;
};

export const TOOL_CATEGORY_LABELS: Record<ToolCategory, string> = {
  basic: "Basic",
  chart: "Chart",
  "price-action": "Price Action",
  "binary-utility": "Binary / Utility"
};

export const TOOL_CATEGORY_ORDER: ToolCategory[] = ["basic", "chart", "price-action", "binary-utility"];

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    id: "select",
    label: "Select / Move",
    mode: "basic",
    category: "basic",
    icon: Pointer,
    description: "Select existing objects, move them, and drag anchor handles to edit.",
    shortcut: "V",
    favoritable: true
  },
  {
    id: "pen",
    label: "Pen",
    mode: "basic",
    category: "basic",
    icon: Pen,
    description: "Freehand drawing with the current stroke color and width.",
    shortcut: "Ctrl+Shift+P",
    favoritable: true
  },
  {
    id: "highlighter",
    label: "Highlighter",
    mode: "basic",
    category: "basic",
    icon: Highlighter,
    description: "Transparent freehand markup for emphasis over charts and recordings.",
    shortcut: "Ctrl+Shift+H",
    favoritable: true
  },
  {
    id: "arrow",
    label: "Arrow",
    mode: "basic",
    category: "basic",
    icon: ArrowUpRight,
    description: "Two-point arrow for directional annotations.",
    shortcut: "Ctrl+Shift+A",
    favoritable: true
  },
  {
    id: "rectangle",
    label: "Rectangle",
    mode: "basic",
    category: "basic",
    icon: RectangleHorizontal,
    description: "Two-corner rectangle for generic markup.",
    shortcut: "Ctrl+Shift+R",
    favoritable: true
  },
  {
    id: "text",
    label: "Text",
    mode: "basic",
    category: "basic",
    icon: Type,
    description: "Click to place a text label and edit it later from the property panel.",
    shortcut: "Ctrl+Shift+T",
    favoritable: true
  },
  {
    id: "eraser",
    label: "Eraser",
    mode: "basic",
    category: "basic",
    icon: Eraser,
    description: "Remove existing annotations by hovering over them.",
    shortcut: "Ctrl+Shift+E",
    favoritable: true
  },
  {
    id: "horizontal_line",
    label: "Horizontal Line",
    mode: "trading",
    category: "chart",
    icon: Minus,
    description: "Single-click horizontal level that spans the overlay width.",
    favoritable: true
  },
  {
    id: "vertical_marker",
    label: "Vertical Marker",
    mode: "trading",
    category: "chart",
    icon: SeparatorVertical,
    description: "Single-click neutral vertical marker for charts or video timing.",
    favoritable: true
  },
  {
    id: "ray",
    label: "Ray",
    mode: "trading",
    category: "chart",
    icon: ArrowUpRight,
    description: "Two-point ray that extends through the second point to the canvas edge.",
    favoritable: true
  },
  {
    id: "trend",
    label: "Trend Line",
    mode: "trading",
    category: "chart",
    icon: MoveUpRight,
    description: "Multi-segment trend markup with editable anchors and labels.",
    favoritable: true
  },
  {
    id: "channel",
    label: "Parallel Channel",
    mode: "trading",
    category: "chart",
    icon: Columns2,
    description: "Base line plus parallel range for channels and ranges.",
    favoritable: true
  },
  {
    id: "fibonacci_retracement",
    label: "Fibonacci Retracement",
    mode: "trading",
    category: "chart",
    icon: ScanLine,
    description: "Two-point retracement with default Fibonacci levels.",
    favoritable: true
  },
  {
    id: "fibonacci_fan",
    label: "Fibonacci Fan",
    mode: "trading",
    category: "chart",
    icon: Waves,
    description: "Two-point fan rays derived from common Fibonacci ratios.",
    favoritable: true
  },
  {
    id: "andrews_pitchfork",
    label: "Andrew's Pitchfork",
    mode: "trading",
    category: "chart",
    icon: GitFork,
    description: "Three-point pitchfork with a median line and upper/lower parallels.",
    favoritable: true
  },
  {
    id: "support_resistance_zone",
    label: "Support / Resistance",
    mode: "trading",
    category: "price-action",
    icon: Layers3,
    description: "Two-corner support or resistance zone with editable label and fill.",
    favoritable: true
  },
  {
    id: "qm_bullish",
    label: "QM Bullish",
    mode: "trading",
    category: "price-action",
    icon: Orbit,
    description: "Manual five-point bullish Quasimodo pattern.",
    favoritable: true
  },
  {
    id: "qm_bearish",
    label: "QM Bearish",
    mode: "trading",
    category: "price-action",
    icon: Radar,
    description: "Manual five-point bearish Quasimodo pattern.",
    favoritable: true
  },
  {
    id: "bos",
    label: "BOS",
    mode: "trading",
    category: "price-action",
    icon: Combine,
    description: "Manual break-of-structure line with anchor editing.",
    favoritable: true
  },
  {
    id: "choch",
    label: "CHoCH",
    mode: "trading",
    category: "price-action",
    icon: GitCompareArrows,
    description: "Manual change-of-character line with distinct styling.",
    favoritable: true
  },
  {
    id: "fvg",
    label: "FVG",
    mode: "trading",
    category: "price-action",
    icon: PanelTop,
    description: "Two-corner fair value gap zone with optional extend-right behavior.",
    favoritable: true
  },
  {
    id: "liquidity_sweep",
    label: "Liquidity Sweep",
    mode: "trading",
    category: "price-action",
    icon: Waves,
    description: "Three-point liquidity level and sweep wick annotation.",
    favoritable: true
  },
  {
    id: "call_marker",
    label: "CALL Marker",
    mode: "binary",
    category: "binary-utility",
    icon: ArrowUp,
    description: "Manual upward marker for local annotation only.",
    favoritable: true
  },
  {
    id: "put_marker",
    label: "PUT Marker",
    mode: "binary",
    category: "binary-utility",
    icon: ArrowDown,
    description: "Manual downward marker for local annotation only.",
    favoritable: true
  }
];

export const DEFAULT_FAVORITE_TOOLS: ToolKind[] = [
  "select",
  "pen",
  "arrow",
  "rectangle",
  "trend",
  "channel",
  "horizontal_line",
  "fvg"
];

const LEGACY_TOOL_IDS = new Set<ToolKind>(["expiry_line"]);
const USER_TOOL_IDS = new Set<ToolKind>(TOOL_DEFINITIONS.map((tool) => tool.id));
export const TOOL_IDS = new Set<ToolKind>([...USER_TOOL_IDS, ...LEGACY_TOOL_IDS]);

export const HISTORY_ACTIONS = [
  { id: "undo", label: "Undo", icon: Undo2 },
  { id: "redo", label: "Redo", icon: Redo2 },
  { id: "clear", label: "Clear", icon: Trash2 },
  { id: "toggle-visibility", label: "Hide", icon: EyeOff },
  { id: "show-visibility", label: "Show", icon: Eye }
] as const;

export function getToolDefinition(tool: ToolKind) {
  return TOOL_DEFINITIONS.find((entry) => entry.id === tool);
}

export function getUserFacingTools() {
  return TOOL_DEFINITIONS.filter((entry) => !entry.legacy);
}

export function getToolsByCategory(category: ToolCategory) {
  return getUserFacingTools().filter((tool) => tool.category === category);
}

export function isToolKind(value: unknown): value is ToolKind {
  return typeof value === "string" && TOOL_IDS.has(value as ToolKind);
}

export function isUserFacingTool(tool: ToolKind) {
  return USER_TOOL_IDS.has(tool);
}

export function getToolMode(tool: ToolKind): ToolMode {
  return tool === "expiry_line" ? "binary" : getToolDefinition(tool)?.mode ?? "basic";
}

export function canFavoriteTool(tool: ToolKind) {
  return getToolDefinition(tool)?.favoritable === true;
}

export function normalizeFavoriteTools(tools: ToolKind[], max = 8) {
  const normalized = tools.filter(isToolKind).filter(canFavoriteTool);
  return [...new Set(normalized)].slice(0, max);
}

export function registerRecentTool(recentTools: ToolKind[], tool: ToolKind, max = 5) {
  if (!isUserFacingTool(tool)) {
    return recentTools.filter(isUserFacingTool).slice(0, max);
  }

  return [tool, ...recentTools.filter((entry) => entry !== tool && isUserFacingTool(entry))].slice(0, max);
}

export function searchTools(query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return getUserFacingTools();
  }

  return getUserFacingTools().filter((tool) => {
    const haystack = `${tool.label} ${tool.description} ${tool.category}`.toLowerCase();
    return haystack.includes(normalized);
  });
}
