import type { TimerPreset, TimerSizeMode } from "../types/settings";
import type { Point } from "../types/drawables";

export type TimerStatus = "idle" | "running" | "paused" | "finished";

export type OverlayTimerState = {
  visible: boolean;
  status: TimerStatus;
  durationMs: number;
  remainingMs: number;
  startedAt?: number;
  endsAt?: number;
  position: Point;
  size: TimerSizeMode;
  opacity: number;
  preset: TimerPreset;
};

export const TIMER_PRESET_DURATIONS: Record<TimerPreset, number> = {
  "1m": 60_000,
  "5m": 300_000,
  "15m": 900_000,
  custom: 60_000
};

export function getTimerPresetLabel(preset: TimerPreset) {
  switch (preset) {
    case "1m":
      return "1m";
    case "5m":
      return "5m";
    case "15m":
      return "15m";
    default:
      return "Custom";
  }
}

export function formatTimerClock(remainingMs: number) {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function createIdleTimerState(input: {
  visible: boolean;
  durationMs: number;
  position: Point;
  size: TimerSizeMode;
  opacity: number;
  preset: TimerPreset;
}): OverlayTimerState {
  return {
    visible: input.visible,
    status: "idle",
    durationMs: input.durationMs,
    remainingMs: input.durationMs,
    position: input.position,
    size: input.size,
    opacity: input.opacity,
    preset: input.preset
  };
}

export function setTimerDuration(state: OverlayTimerState, durationMs: number, preset: TimerPreset): OverlayTimerState {
  return {
    ...state,
    status: "idle",
    durationMs,
    remainingMs: durationMs,
    startedAt: undefined,
    endsAt: undefined,
    preset
  };
}

export function startTimer(state: OverlayTimerState, now: number): OverlayTimerState {
  return {
    ...state,
    status: "running",
    remainingMs: state.durationMs,
    startedAt: now,
    endsAt: now + state.durationMs
  };
}

export function pauseTimer(state: OverlayTimerState, now: number): OverlayTimerState {
  if (state.status !== "running" || typeof state.endsAt !== "number") {
    return state;
  }

  return {
    ...state,
    status: "paused",
    remainingMs: Math.max(0, state.endsAt - now),
    startedAt: undefined,
    endsAt: undefined
  };
}

export function resumeTimer(state: OverlayTimerState, now: number): OverlayTimerState {
  if (state.status !== "paused") {
    return state;
  }

  return {
    ...state,
    status: "running",
    startedAt: now,
    endsAt: now + state.remainingMs
  };
}

export function resetTimer(state: OverlayTimerState): OverlayTimerState {
  return {
    ...state,
    status: "idle",
    remainingMs: state.durationMs,
    startedAt: undefined,
    endsAt: undefined
  };
}

export function tickTimer(state: OverlayTimerState, now: number): OverlayTimerState {
  if (state.status !== "running" || typeof state.endsAt !== "number") {
    return state;
  }

  const remainingMs = Math.max(0, state.endsAt - now);
  if (remainingMs > 0) {
    return { ...state, remainingMs };
  }

  return {
    ...state,
    status: "finished",
    remainingMs: 0,
    startedAt: undefined,
    endsAt: undefined
  };
}
