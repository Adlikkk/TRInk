import { useEffect, useRef } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { formatTimerClock, getTimerPresetLabel, type OverlayTimerState } from "../lib/timer";

type TimerOverlayProps = {
  timer: OverlayTimerState;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onMove: (position: { x: number; y: number }) => void;
  onMoveEnd: (position: { x: number; y: number }) => void;
};

const TIMER_STYLES = {
  compact: {
    width: "w-[156px]",
    time: "text-2xl",
    label: "text-[10px]",
    controls: "h-7 w-7"
  },
  normal: {
    width: "w-[188px]",
    time: "text-[32px]",
    label: "text-[11px]",
    controls: "h-8 w-8"
  }
} as const;

export function TimerOverlay({
  timer,
  onStart,
  onPause,
  onResume,
  onReset,
  onMove,
  onMoveEnd
}: TimerOverlayProps) {
  const dragOriginRef = useRef<{ pointerX: number; pointerY: number; x: number; y: number } | null>(null);
  const sizeStyle = TIMER_STYLES[timer.size];

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      const origin = dragOriginRef.current;
      if (!origin) {
        return;
      }

      onMove({
        x: origin.x + (event.clientX - origin.pointerX),
        y: origin.y + (event.clientY - origin.pointerY)
      });
    };

    const onPointerUp = () => {
      const origin = dragOriginRef.current;
      if (origin) {
        onMoveEnd(timer.position);
      }
      dragOriginRef.current = null;
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [onMove, onMoveEnd, timer.position]);

  const actionButtonBase =
    "flex items-center justify-center rounded-lg border border-[rgba(148,163,184,0.18)] bg-[rgba(15,23,42,0.7)] text-[#E5E7EB] transition hover:border-[rgba(148,163,184,0.3)] hover:bg-[rgba(30,41,59,0.88)]";

  return (
    <div
      className={`pointer-events-auto absolute z-20 ${sizeStyle.width} rounded-[22px] border border-[rgba(148,163,184,0.22)] bg-[rgba(2,8,23,0.82)] p-3 text-[#E5E7EB] shadow-[0_22px_58px_rgba(2,8,23,0.45)] backdrop-blur-xl`}
      style={{ left: timer.position.x, top: timer.position.y, opacity: timer.opacity }}
    >
      <button
        type="button"
        className="mb-2 flex w-full cursor-move items-center justify-between rounded-xl border border-[rgba(148,163,184,0.14)] bg-[rgba(15,23,42,0.52)] px-2.5 py-1.5 text-left"
        onPointerDown={(event) => {
          dragOriginRef.current = {
            pointerX: event.clientX,
            pointerY: event.clientY,
            x: timer.position.x,
            y: timer.position.y
          };
        }}
        title="Drag timer"
      >
        <span className={`font-semibold uppercase tracking-[0.2em] text-[#94A3B8] ${sizeStyle.label}`}>Timer</span>
        <span
          className={`rounded-full border px-2 py-0.5 font-medium ${sizeStyle.label} ${
            timer.status === "finished"
              ? "border-[rgba(248,113,113,0.3)] bg-[rgba(127,29,29,0.32)] text-[#FCA5A5]"
              : "border-[rgba(148,163,184,0.16)] bg-[rgba(15,23,42,0.72)] text-[#CBD5E1]"
          }`}
        >
          {getTimerPresetLabel(timer.preset)}
        </span>
      </button>

      <div
        className={`font-semibold tabular-nums ${sizeStyle.time} ${
          timer.status === "finished" ? "text-[#FCA5A5]" : "text-[#F8FAFC]"
        }`}
      >
        {formatTimerClock(timer.remainingMs)}
      </div>
      <div className={`mt-1 ${sizeStyle.label} text-[#94A3B8]`}>
        {timer.status === "finished"
          ? "Finished"
          : timer.status === "running"
            ? "Running"
            : timer.status === "paused"
              ? "Paused"
              : "Ready"}
      </div>

      <div className="mt-3 flex items-center gap-2">
        {timer.status === "running" ? (
          <button type="button" onClick={onPause} className={`${actionButtonBase} ${sizeStyle.controls}`} title="Pause">
            <Pause className="h-3.5 w-3.5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={timer.status === "paused" ? onResume : onStart}
            className={`${actionButtonBase} ${sizeStyle.controls}`}
            title={timer.status === "paused" ? "Resume" : "Start"}
          >
            <Play className="h-3.5 w-3.5" />
          </button>
        )}
        <button type="button" onClick={onReset} className={`${actionButtonBase} ${sizeStyle.controls}`} title="Reset">
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
