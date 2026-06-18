export type UiWindowBoundsSource = "toolbar" | "palette" | "settings";

export type UiWindowBounds = {
  source: UiWindowBoundsSource;
  x: number;
  y: number;
  width: number;
  height: number;
};

export function isScreenPointInsideUiWindowBounds(
  screenX: number,
  screenY: number,
  bounds: UiWindowBounds
) {
  return (
    screenX >= bounds.x &&
    screenX <= bounds.x + bounds.width &&
    screenY >= bounds.y &&
    screenY <= bounds.y + bounds.height
  );
}

export function isScreenPointInsideAnyUiWindowBounds(
  screenX: number,
  screenY: number,
  bounds: UiWindowBounds[]
) {
  return bounds.some((entry) => isScreenPointInsideUiWindowBounds(screenX, screenY, entry));
}
