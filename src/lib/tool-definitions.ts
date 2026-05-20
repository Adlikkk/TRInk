import {
  ArrowUpRight,
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
  ArrowUp,
  ArrowDown,
  SeparatorVertical
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ToolKind, ToolMode } from "../types/drawables";

export type ToolDefinition = {
  id: ToolKind;
  label: string;
  mode: ToolMode;
  icon: LucideIcon;
};

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  { id: "pen", label: "Pen", mode: "basic", icon: Pen },
  { id: "highlighter", label: "Highlighter", mode: "basic", icon: Highlighter },
  { id: "arrow", label: "Arrow", mode: "basic", icon: ArrowUpRight },
  { id: "rectangle", label: "Rectangle", mode: "basic", icon: RectangleHorizontal },
  { id: "text", label: "Text", mode: "basic", icon: Type },
  { id: "eraser", label: "Eraser", mode: "basic", icon: Eraser },
  { id: "trend", label: "Trend", mode: "trading", icon: MoveUpRight },
  { id: "channel", label: "Channel", mode: "trading", icon: Columns2 },
  {
    id: "support_resistance_zone",
    label: "S/R Zone",
    mode: "trading",
    icon: Layers3
  },
  { id: "call_marker", label: "CALL", mode: "binary", icon: ArrowUp },
  { id: "put_marker", label: "PUT", mode: "binary", icon: ArrowDown },
  {
    id: "expiry_line",
    label: "Expiry",
    mode: "binary",
    icon: SeparatorVertical
  }
];

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
