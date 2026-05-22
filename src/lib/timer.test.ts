import { describe, expect, it } from "vitest";
import {
  createIdleTimerState,
  formatTimerClock,
  pauseTimer,
  resetTimer,
  resumeTimer,
  setTimerDuration,
  startTimer,
  tickTimer
} from "./timer";

describe("timer utilities", () => {
  it("formats countdown values safely", () => {
    expect(formatTimerClock(59_001)).toBe("01:00");
    expect(formatTimerClock(58_001)).toBe("00:59");
    expect(formatTimerClock(0)).toBe("00:00");
  });

  it("handles start, pause, resume, and reset transitions", () => {
    const idle = createIdleTimerState({
      visible: true,
      durationMs: 60_000,
      position: { x: 32, y: 32 },
      size: "compact",
      opacity: 0.9,
      preset: "1m"
    });

    const running = startTimer(idle, 1_000);
    expect(running.status).toBe("running");
    expect(running.endsAt).toBe(61_000);

    const paused = pauseTimer(running, 31_000);
    expect(paused.status).toBe("paused");
    expect(paused.remainingMs).toBe(30_000);

    const resumed = resumeTimer(paused, 50_000);
    expect(resumed.status).toBe("running");
    expect(resumed.endsAt).toBe(80_000);

    const reset = resetTimer(resumed);
    expect(reset.status).toBe("idle");
    expect(reset.remainingMs).toBe(60_000);
  });

  it("finishes accurately and resets duration on updates", () => {
    const running = startTimer(
      createIdleTimerState({
        visible: true,
        durationMs: 5_000,
        position: { x: 12, y: 12 },
        size: "normal",
        opacity: 1,
        preset: "custom"
      }),
      1_000
    );

    const ticking = tickTimer(running, 4_000);
    expect(ticking.remainingMs).toBe(2_000);

    const finished = tickTimer(ticking, 6_100);
    expect(finished.status).toBe("finished");
    expect(finished.remainingMs).toBe(0);

    const updated = setTimerDuration(finished, 300_000, "5m");
    expect(updated.status).toBe("idle");
    expect(updated.durationMs).toBe(300_000);
    expect(updated.remainingMs).toBe(300_000);
  });
});
