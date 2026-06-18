import type { ToolKind, ToolMode } from "../types/drawables";
import type { ToolCategory, ToolDefinition } from "../lib/tool-definitions";
import { getToolDefinition, searchTools, TOOL_CATEGORY_LABELS, TOOL_CATEGORY_ORDER, TOOL_DEFINITIONS } from "../lib/tool-definitions";
import { basicEdition } from "./basic";
import { tradingEdition } from "./trading";
import type { EditionFeatureFlags } from "./features";

export type AppEditionId = "basic" | "trading";

export type AppEdition = {
  id: AppEditionId;
  name: string;
  productName: string;
  shortName: string;
  toolbarLabel: string;
  windowTitle: string;
  description: string;
  aboutSummary: string;
  availableModes: ToolMode[];
  visibleToolIds: ToolKind[];
  defaultTool: ToolKind;
  defaultFavoriteTools: ToolKind[];
  features: EditionFeatureFlags;
};

const EDITIONS: Record<AppEditionId, AppEdition> = {
  basic: basicEdition,
  trading: tradingEdition
};

export function isEditionId(value: unknown): value is AppEditionId {
  return value === "basic" || value === "trading";
}

export function getEdition(editionId: AppEditionId) {
  return EDITIONS[editionId];
}

export function getCurrentEdition() {
  const candidate = import.meta.env.VITE_TRINK_EDITION;
  return getEdition(isEditionId(candidate) ? candidate : "trading");
}

export function isToolAllowedInEdition(tool: ToolKind, edition: AppEdition) {
  return edition.visibleToolIds.includes(tool);
}

export function normalizeEditionTool(tool: ToolKind, edition: AppEdition) {
  return isToolAllowedInEdition(tool, edition) ? tool : edition.defaultTool;
}

export function normalizeEditionToolMode(mode: ToolMode, edition: AppEdition): ToolMode {
  return edition.availableModes.includes(mode) ? mode : edition.availableModes[0];
}

export function getEditionTools(edition: AppEdition): ToolDefinition[] {
  const allowedTools = new Set(edition.visibleToolIds);
  return TOOL_DEFINITIONS.filter((tool) => allowedTools.has(tool.id));
}

export function getEditionToolsByCategory(edition: AppEdition, category: ToolCategory) {
  return getEditionTools(edition).filter((tool) => tool.category === category);
}

export function getEditionCategoryOrder(edition: AppEdition) {
  const toolCategories = new Set(getEditionTools(edition).map((tool) => tool.category));
  return TOOL_CATEGORY_ORDER.filter((category) => toolCategories.has(category));
}

export function getEditionCategoryLabel(category: ToolCategory) {
  return TOOL_CATEGORY_LABELS[category];
}

export function searchEditionTools(edition: AppEdition, query: string) {
  const allowedTools = new Set(edition.visibleToolIds);
  return searchTools(query).filter((tool) => allowedTools.has(tool.id));
}

export function normalizeEditionFavoriteTools(tools: ToolKind[], edition: AppEdition, max = 8) {
  const allowedTools = new Set(edition.visibleToolIds);
  return [...new Set(tools.filter((tool) => allowedTools.has(tool)).filter((tool) => getToolDefinition(tool)?.favoritable))].slice(0, max);
}

export function normalizeEditionRecentTools(tools: ToolKind[], edition: AppEdition, max = 5) {
  const allowedTools = new Set(edition.visibleToolIds);
  return [...new Set(tools.filter((tool) => allowedTools.has(tool)))].slice(0, max);
}
