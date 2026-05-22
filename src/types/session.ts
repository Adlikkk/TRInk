import type { Drawable } from "./drawables";

export const TRINK_SESSION_SCHEMA_VERSION = 1;

export type TrinkSession = {
  schemaVersion: number;
  appVersion: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  drawings: Drawable[];
  settingsSnapshot?: {
    canvasWidth?: number;
    canvasHeight?: number;
    drawingTargetMonitor?: string;
  };
};

export type SessionParseSuccess = {
  ok: true;
  session: TrinkSession;
  ignoredDrawables: number;
};

export type SessionParseFailure = {
  ok: false;
  error: string;
};

export type SessionParseResult = SessionParseSuccess | SessionParseFailure;
