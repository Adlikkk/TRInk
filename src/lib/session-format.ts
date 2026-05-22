import { sanitizeDrawablesWithReport } from "./drawable-validation";
import { APP_VERSION } from "./app-meta";
import type { Drawable } from "../types/drawables";
import type { DrawingTargetMonitor } from "../types/settings";
import {
  TRINK_SESSION_SCHEMA_VERSION,
  type SessionParseResult,
  type TrinkSession
} from "../types/session";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function toIsoString(value: unknown, fallback: string) {
  if (!isNonEmptyString(value)) {
    return fallback;
  }

  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : fallback;
}

export function formatSessionTimestampParts(date = new Date()) {
  const pad = (value: number) => value.toString().padStart(2, "0");
  return {
    year: date.getFullYear(),
    month: pad(date.getMonth() + 1),
    day: pad(date.getDate()),
    hour: pad(date.getHours()),
    minute: pad(date.getMinutes())
  };
}

export function buildDefaultSessionFilename(date = new Date()) {
  const { year, month, day, hour, minute } = formatSessionTimestampParts(date);
  return `TRInk-session-${year}-${month}-${day}-${hour}-${minute}.trink.json`;
}

export function getSessionNameFromPath(path: string) {
  const leaf = path.split(/[\\/]/).pop() ?? path;
  return leaf.replace(/\.trink\.json$/i, "").replace(/\.json$/i, "") || "Untitled session";
}

export function createSessionPayload(input: {
  name: string;
  drawings: Drawable[];
  drawingTargetMonitor?: DrawingTargetMonitor;
  canvasWidth?: number;
  canvasHeight?: number;
  createdAt?: string;
  updatedAt?: string;
}): TrinkSession {
  const now = new Date().toISOString();
  const sanitized = sanitizeDrawablesWithReport(input.drawings);
  return {
    schemaVersion: TRINK_SESSION_SCHEMA_VERSION,
    appVersion: APP_VERSION,
    createdAt: input.createdAt ?? now,
    updatedAt: input.updatedAt ?? now,
    name: input.name.trim() || "Untitled session",
    drawings: sanitized.drawables,
    settingsSnapshot: {
      canvasWidth: input.canvasWidth,
      canvasHeight: input.canvasHeight,
      drawingTargetMonitor: input.drawingTargetMonitor
    }
  };
}

export function serializeSession(session: TrinkSession) {
  return JSON.stringify(session, null, 2);
}

export function parseSessionJson(input: string): SessionParseResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(input);
  } catch {
    return { ok: false, error: "Invalid JSON. TRInk could not parse this session file." };
  }

  if (!isRecord(parsed)) {
    return { ok: false, error: "Invalid session file. Expected a JSON object." };
  }

  if (parsed.schemaVersion !== TRINK_SESSION_SCHEMA_VERSION) {
    return {
      ok: false,
      error: `Unsupported session schema version: ${String(parsed.schemaVersion ?? "unknown")}.`
    };
  }

  if (!Array.isArray(parsed.drawings)) {
    return { ok: false, error: "Invalid session file. Missing drawings array." };
  }

  if (!isNonEmptyString(parsed.name)) {
    return { ok: false, error: "Invalid session file. Missing session name." };
  }

  const sanitized = sanitizeDrawablesWithReport(parsed.drawings as unknown[]);
  const fallbackTimestamp = new Date().toISOString();

  return {
    ok: true,
    ignoredDrawables: sanitized.ignoredDrawables,
    session: {
      schemaVersion: TRINK_SESSION_SCHEMA_VERSION,
      appVersion: isNonEmptyString(parsed.appVersion) ? parsed.appVersion : "unknown",
      createdAt: toIsoString(parsed.createdAt, fallbackTimestamp),
      updatedAt: toIsoString(parsed.updatedAt, fallbackTimestamp),
      name: parsed.name.trim(),
      drawings: sanitized.drawables,
      settingsSnapshot: isRecord(parsed.settingsSnapshot)
        ? {
            canvasWidth:
              typeof parsed.settingsSnapshot.canvasWidth === "number"
                ? parsed.settingsSnapshot.canvasWidth
                : undefined,
            canvasHeight:
              typeof parsed.settingsSnapshot.canvasHeight === "number"
                ? parsed.settingsSnapshot.canvasHeight
                : undefined,
            drawingTargetMonitor: isNonEmptyString(parsed.settingsSnapshot.drawingTargetMonitor)
              ? parsed.settingsSnapshot.drawingTargetMonitor
              : undefined
          }
        : undefined
    }
  };
}
