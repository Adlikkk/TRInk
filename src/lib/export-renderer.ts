import { renderDrawable } from "./rendering";
import { sanitizeDrawablesWithReport } from "./drawable-validation";
import type { Drawable } from "../types/drawables";

const MAX_EXPORT_PIXELS = 33_177_600;
const MAX_EXPORT_DIMENSION = 8_192;
const MAX_EXPORT_PIXEL_RATIO = 2;

export type ExportRenderPlan = {
  width: number;
  height: number;
  renderWidth: number;
  renderHeight: number;
  pixelRatio: number;
  ignoredDrawables: number;
  drawables: Drawable[];
};

function normalizeDimension(value: number, fallback: number) {
  return Number.isFinite(value) && value > 0 ? Math.round(value) : fallback;
}

export function prepareAnnotationExportPlan(input: {
  drawables: Drawable[];
  width: number;
  height: number;
  pixelRatio?: number;
}): ExportRenderPlan {
  const width = normalizeDimension(input.width, 1);
  const height = normalizeDimension(input.height, 1);
  const pixelRatio = Math.min(
    MAX_EXPORT_PIXEL_RATIO,
    Math.max(1, Number.isFinite(input.pixelRatio) ? input.pixelRatio ?? 1 : 1)
  );
  const renderWidth = Math.round(width * pixelRatio);
  const renderHeight = Math.round(height * pixelRatio);

  if (renderWidth > MAX_EXPORT_DIMENSION || renderHeight > MAX_EXPORT_DIMENSION) {
    throw new Error("Export size is too large for TRInk to render safely.");
  }

  if (renderWidth * renderHeight > MAX_EXPORT_PIXELS) {
    throw new Error("Export area is too large. Reduce the monitor size or scaling and try again.");
  }

  const sanitized = sanitizeDrawablesWithReport(input.drawables);

  return {
    width,
    height,
    renderWidth,
    renderHeight,
    pixelRatio,
    ignoredDrawables: sanitized.ignoredDrawables,
    drawables: sanitized.drawables
  };
}

function renderAnnotationsToCanvas(plan: ExportRenderPlan) {
  if (typeof document === "undefined") {
    throw new Error("TRInk export is unavailable outside the desktop renderer.");
  }

  const canvas = document.createElement("canvas");
  canvas.width = plan.renderWidth;
  canvas.height = plan.renderHeight;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("TRInk could not create an export canvas.");
  }

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.scale(plan.pixelRatio, plan.pixelRatio);

  for (const drawable of plan.drawables) {
    renderDrawable(context, drawable);
  }

  return canvas;
}

export async function renderAnnotationsToPngBytes(input: {
  drawables: Drawable[];
  width: number;
  height: number;
  pixelRatio?: number;
}) {
  const plan = prepareAnnotationExportPlan(input);
  const canvas = renderAnnotationsToCanvas(plan);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((nextBlob) => {
      if (!nextBlob) {
        reject(new Error("TRInk could not encode the annotation export."));
        return;
      }

      resolve(nextBlob);
    }, "image/png");
  });

  return new Uint8Array(await blob.arrayBuffer());
}
