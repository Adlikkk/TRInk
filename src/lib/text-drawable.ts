import type { TextAlign, TextFontWeight, TextShape } from "../types/drawables";

export const DEFAULT_TEXT_FONT_SIZE = 18;
export const DEFAULT_TEXT_FONT_WEIGHT: TextFontWeight = "semibold";
export const DEFAULT_TEXT_ALIGN: TextAlign = "left";
export const DEFAULT_TEXT_BACKGROUND_COLOR = "#020817";
export const DEFAULT_TEXT_BACKGROUND_OPACITY = 0.82;
export const DEFAULT_TEXT_PADDING = 8;
export const DEFAULT_TEXT_BORDER_COLOR = "#334155";
export const DEFAULT_TEXT_BORDER_RADIUS = 10;
export const MIN_TEXT_FONT_SIZE = 8;
export const MAX_TEXT_FONT_SIZE = 96;
export const MAX_TEXT_PADDING = 32;
export const MAX_TEXT_BORDER_RADIUS = 32;

export type TextLayoutMetrics = {
  lines: string[];
  lineHeight: number;
  contentWidth: number;
  contentHeight: number;
  padding: number;
  x: number;
  y: number;
  width: number;
  height: number;
  firstBaselineY: number;
};

const FONT_WEIGHT_VALUES: TextFontWeight[] = ["normal", "medium", "semibold", "bold"];
const TEXT_ALIGN_VALUES: TextAlign[] = ["left", "center", "right"];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function sanitizeTextFontWeight(value: unknown): TextFontWeight {
  return FONT_WEIGHT_VALUES.includes(value as TextFontWeight)
    ? (value as TextFontWeight)
    : DEFAULT_TEXT_FONT_WEIGHT;
}

export function sanitizeTextAlign(value: unknown): TextAlign {
  return TEXT_ALIGN_VALUES.includes(value as TextAlign) ? (value as TextAlign) : DEFAULT_TEXT_ALIGN;
}

export function clampTextFontSize(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? clamp(value, MIN_TEXT_FONT_SIZE, MAX_TEXT_FONT_SIZE)
    : DEFAULT_TEXT_FONT_SIZE;
}

export function clampTextOpacity(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? clamp(value, 0, 1) : fallback;
}

export function clampTextPadding(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? clamp(value, 0, MAX_TEXT_PADDING)
    : DEFAULT_TEXT_PADDING;
}

export function clampTextBorderRadius(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? clamp(value, 0, MAX_TEXT_BORDER_RADIUS)
    : DEFAULT_TEXT_BORDER_RADIUS;
}

export function normalizeTextContent(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  const normalized = value.replace(/\r\n?/g, "\n");
  return normalized.trim();
}

export function splitTextLines(text: string) {
  return text.replace(/\r\n?/g, "\n").split("\n");
}

function estimateLineWidth(line: string, fontSize: number, fontWeight: TextFontWeight) {
  const weightFactor =
    fontWeight === "bold" ? 0.67 : fontWeight === "semibold" ? 0.65 : fontWeight === "medium" ? 0.63 : 0.6;
  return Math.max(fontSize * 0.55, line.length * fontSize * weightFactor);
}

export function estimateTextLayout(textDrawable: Pick<
  TextShape,
  | "point"
  | "text"
  | "fontSize"
  | "fontWeight"
  | "align"
  | "backgroundEnabled"
  | "borderEnabled"
  | "padding"
>) {
  const fontSize = clampTextFontSize(textDrawable.fontSize);
  const fontWeight = sanitizeTextFontWeight(textDrawable.fontWeight);
  const align = sanitizeTextAlign(textDrawable.align);
  const lines = splitTextLines(textDrawable.text);
  const lineHeight = Math.max(fontSize * 1.25, fontSize + 6);
  const contentWidth = Math.max(...lines.map((line) => estimateLineWidth(line || " ", fontSize, fontWeight)));
  const contentHeight = Math.max(fontSize, lineHeight * lines.length);
  const padding =
    textDrawable.backgroundEnabled || textDrawable.borderEnabled
      ? clampTextPadding(textDrawable.padding)
      : Math.max(4, clampTextPadding(textDrawable.padding) * 0.5);

  const x =
    align === "center"
      ? textDrawable.point.x - contentWidth / 2 - padding
      : align === "right"
        ? textDrawable.point.x - contentWidth - padding
        : textDrawable.point.x - padding;

  const y = textDrawable.point.y - fontSize - padding;

  return {
    lines,
    lineHeight,
    contentWidth,
    contentHeight,
    padding,
    x,
    y,
    width: contentWidth + padding * 2,
    height: contentHeight + padding * 2,
    firstBaselineY: y + padding + fontSize
  } satisfies TextLayoutMetrics;
}

export function getTextLineX(metrics: TextLayoutMetrics, lineWidth: number, align: TextAlign) {
  const contentLeft = metrics.x + metrics.padding;
  if (align === "center") {
    return contentLeft + (metrics.contentWidth - lineWidth) / 2;
  }
  if (align === "right") {
    return contentLeft + metrics.contentWidth - lineWidth;
  }
  return contentLeft;
}

export function getTextFontDeclaration(textDrawable: Pick<TextShape, "fontSize" | "fontWeight">) {
  const fontSize = clampTextFontSize(textDrawable.fontSize);
  const fontWeight = sanitizeTextFontWeight(textDrawable.fontWeight);
  const cssWeight =
    fontWeight === "normal" ? 400 : fontWeight === "medium" ? 500 : fontWeight === "semibold" ? 600 : 700;
  return `${cssWeight} ${fontSize}px Segoe UI`;
}
