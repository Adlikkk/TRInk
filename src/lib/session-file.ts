import { ask, open, save } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { parseSessionJson, serializeSession } from "./session-format";
import type { SessionParseResult, TrinkSession } from "../types/session";

export type LoadedSessionFile =
  | {
      ok: true;
      path: string;
      parsed: Extract<SessionParseResult, { ok: true }>;
    }
  | {
      ok: false;
      error: string;
    }
  | {
      ok: false;
      cancelled: true;
    };

export async function requestSaveSessionPath(defaultPath: string) {
  return save({
    defaultPath,
    filters: [{ name: "TRInk Session", extensions: ["json"] }]
  });
}

export async function writeSessionFile(path: string, session: TrinkSession) {
  await writeTextFile(path, serializeSession(session));
}

export async function requestOpenSessionPath() {
  const path = await open({
    multiple: false,
    directory: false,
    filters: [{ name: "TRInk Session", extensions: ["json"] }]
  });

  return typeof path === "string" ? path : null;
}

export async function readSessionFile(path: string): Promise<LoadedSessionFile> {
  try {
    const content = await readTextFile(path);
    const parsed = parseSessionJson(content);
    if (!parsed.ok) {
      return { ok: false, error: parsed.error };
    }

    return { ok: true, path, parsed };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "TRInk could not read the selected session file."
    };
  }
}

export async function confirmSessionReplace() {
  return ask(
    "Loading a session will replace the current drawings. Continue?",
    {
      title: "Replace Current Drawings",
      kind: "warning",
      okLabel: "Load Session",
      cancelLabel: "Cancel"
    }
  );
}
