import { APP_VERSION } from "./app-meta";
import { sanitizeDrawablesWithReport } from "./drawable-validation";
import type { Drawable } from "../types/drawables";

export const TRINK_ANNOTATIONS_EXPORT_SCHEMA_VERSION = 1;

export type TrinkAnnotationsExport = {
  schemaVersion: number;
  appVersion: string;
  exportedAt: string;
  name: string;
  drawings: Drawable[];
};

export type ExportPayloadValidationResult =
  | {
      ok: true;
      payload: TrinkAnnotationsExport;
      ignoredDrawables: number;
    }
  | {
      ok: false;
      error: string;
    };

export type CreatedAnnotationsExportPayload = {
  payload: TrinkAnnotationsExport;
  ignoredDrawables: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function formatExportTimestampParts(date = new Date()) {
  const pad = (value: number) => value.toString().padStart(2, "0");
  return {
    year: date.getFullYear(),
    month: pad(date.getMonth() + 1),
    day: pad(date.getDate()),
    hour: pad(date.getHours()),
    minute: pad(date.getMinutes())
  };
}

export function buildDefaultAnnotationsPngFilename(date = new Date()) {
  const { year, month, day, hour, minute } = formatExportTimestampParts(date);
  return `TRInk-annotations-${year}-${month}-${day}-${hour}-${minute}.png`;
}

export function buildDefaultAnnotationsJsonFilename(date = new Date()) {
  const { year, month, day, hour, minute } = formatExportTimestampParts(date);
  return `TRInk-annotations-${year}-${month}-${day}-${hour}-${minute}.json`;
}

export function createAnnotationsExportPayload(input: {
  name: string;
  drawings: Drawable[];
  exportedAt?: string;
}): CreatedAnnotationsExportPayload {
  const exportedAt = input.exportedAt ?? new Date().toISOString();
  const sanitized = sanitizeDrawablesWithReport(input.drawings);

  return {
    ignoredDrawables: sanitized.ignoredDrawables,
    payload: {
      schemaVersion: TRINK_ANNOTATIONS_EXPORT_SCHEMA_VERSION,
      appVersion: APP_VERSION,
      exportedAt,
      name: input.name.trim() || "Untitled annotations",
      drawings: sanitized.drawables
    }
  };
}

export function serializeAnnotationsExport(payload: TrinkAnnotationsExport) {
  return JSON.stringify(payload, null, 2);
}

export function validateAnnotationsExportPayload(input: unknown): ExportPayloadValidationResult {
  if (!isRecord(input)) {
    return { ok: false, error: "Invalid export payload. Expected a JSON object." };
  }

  if (input.schemaVersion !== TRINK_ANNOTATIONS_EXPORT_SCHEMA_VERSION) {
    return {
      ok: false,
      error: `Unsupported annotations export schema version: ${String(input.schemaVersion ?? "unknown")}.`
    };
  }

  if (!Array.isArray(input.drawings)) {
    return { ok: false, error: "Invalid export payload. Missing drawings array." };
  }

  if (!isNonEmptyString(input.name)) {
    return { ok: false, error: "Invalid export payload. Missing export name." };
  }

  const sanitized = sanitizeDrawablesWithReport(input.drawings as unknown[]);

  return {
    ok: true,
    ignoredDrawables: sanitized.ignoredDrawables,
    payload: {
      schemaVersion: TRINK_ANNOTATIONS_EXPORT_SCHEMA_VERSION,
      appVersion: isNonEmptyString(input.appVersion) ? input.appVersion : "unknown",
      exportedAt: isNonEmptyString(input.exportedAt) ? input.exportedAt : new Date().toISOString(),
      name: input.name.trim(),
      drawings: sanitized.drawables
    }
  };
}
