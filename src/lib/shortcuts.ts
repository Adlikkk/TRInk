import type { ToolKind } from "../types/drawables";

export type ShortcutAction =
  | "toggle_overlay"
  | "toggle_click_through"
  | "select_tool"
  | "pen_tool"
  | "highlighter_tool"
  | "arrow_tool"
  | "rectangle_tool"
  | "text_tool"
  | "eraser_tool"
  | "undo"
  | "redo"
  | "clear"
  | "save_session"
  | "load_session"
  | "export_png"
  | "export_json"
  | "timer_toggle"
  | "timer_start_pause"
  | "timer_reset";

export type ShortcutCategory =
  | "overlay"
  | "drawing-tools"
  | "edit-actions"
  | "sessions-export"
  | "timer";

export type ShortcutRegistrationState = "registered" | "unavailable" | "disabled";

export type ShortcutBinding = {
  action: ShortcutAction;
  label: string;
  accelerator: string | null;
  defaultAccelerator: string | null;
  global: boolean;
  enabled: boolean;
};

export type ShortcutDefinition = {
  action: ShortcutAction;
  label: string;
  category: ShortcutCategory;
  description: string;
  defaultAccelerator: string | null;
  global: boolean;
  tool?: ToolKind;
};

export type ShortcutRegistrationStatus = {
  action: ShortcutAction;
  accelerator: string | null;
  state: ShortcutRegistrationState;
  message?: string;
};

export type ShortcutRecordingResult =
  | { type: "cancel" }
  | { type: "clear" }
  | { type: "ignore" }
  | { type: "invalid"; message: string }
  | { type: "captured"; accelerator: string };

export const SHORTCUT_CATEGORY_LABELS: Record<ShortcutCategory, string> = {
  overlay: "Overlay",
  "drawing-tools": "Drawing Tools",
  "edit-actions": "Edit Actions",
  "sessions-export": "Sessions / Export",
  timer: "Timer"
};

export const SHORTCUT_CATEGORY_ORDER: ShortcutCategory[] = [
  "overlay",
  "drawing-tools",
  "edit-actions",
  "sessions-export",
  "timer"
];

export const SHORTCUT_DEFINITIONS: ShortcutDefinition[] = [
  {
    action: "toggle_overlay",
    label: "Toggle overlay visibility",
    category: "overlay",
    description: "Show or hide the overlay and toolbar windows.",
    defaultAccelerator: "Ctrl+Shift+Space",
    global: true
  },
  {
    action: "toggle_click_through",
    label: "Toggle click-through",
    category: "overlay",
    description: "Switch between draw mode and click-through mode.",
    defaultAccelerator: "Ctrl+Shift+X",
    global: true
  },
  {
    action: "select_tool",
    label: "Select / Move tool",
    category: "drawing-tools",
    description: "Switch to the select tool. Focused local shortcut: V.",
    defaultAccelerator: "Ctrl+Shift+V",
    global: true,
    tool: "select"
  },
  {
    action: "pen_tool",
    label: "Pen tool",
    category: "drawing-tools",
    description: "Switch to the pen tool.",
    defaultAccelerator: "Ctrl+Shift+P",
    global: true,
    tool: "pen"
  },
  {
    action: "highlighter_tool",
    label: "Highlighter tool",
    category: "drawing-tools",
    description: "Switch to the highlighter tool.",
    defaultAccelerator: "Ctrl+Shift+H",
    global: true,
    tool: "highlighter"
  },
  {
    action: "arrow_tool",
    label: "Arrow tool",
    category: "drawing-tools",
    description: "Switch to the arrow tool.",
    defaultAccelerator: "Ctrl+Shift+A",
    global: true,
    tool: "arrow"
  },
  {
    action: "rectangle_tool",
    label: "Rectangle tool",
    category: "drawing-tools",
    description: "Switch to the rectangle tool.",
    defaultAccelerator: "Ctrl+Shift+R",
    global: true,
    tool: "rectangle"
  },
  {
    action: "text_tool",
    label: "Text tool",
    category: "drawing-tools",
    description: "Switch to the text tool.",
    defaultAccelerator: "Ctrl+Shift+T",
    global: true,
    tool: "text"
  },
  {
    action: "eraser_tool",
    label: "Eraser tool",
    category: "drawing-tools",
    description: "Switch to the eraser tool.",
    defaultAccelerator: "Ctrl+Shift+E",
    global: true,
    tool: "eraser"
  },
  {
    action: "undo",
    label: "Undo",
    category: "edit-actions",
    description: "Undo the last committed drawing or edit.",
    defaultAccelerator: "Ctrl+Z",
    global: true
  },
  {
    action: "redo",
    label: "Redo",
    category: "edit-actions",
    description: "Redo the last undone change.",
    defaultAccelerator: "Ctrl+Y",
    global: true
  },
  {
    action: "clear",
    label: "Clear drawings",
    category: "edit-actions",
    description: "Clear all current drawings after the existing confirmation flow.",
    defaultAccelerator: "Ctrl+Shift+Backspace",
    global: true
  },
  {
    action: "save_session",
    label: "Save session",
    category: "sessions-export",
    description: "Open the save-session dialog.",
    defaultAccelerator: null,
    global: true
  },
  {
    action: "load_session",
    label: "Load session",
    category: "sessions-export",
    description: "Open the load-session dialog.",
    defaultAccelerator: null,
    global: true
  },
  {
    action: "export_png",
    label: "Export annotations PNG",
    category: "sessions-export",
    description: "Export the current annotations to a transparent PNG.",
    defaultAccelerator: null,
    global: true
  },
  {
    action: "export_json",
    label: "Export annotations JSON",
    category: "sessions-export",
    description: "Export the current annotations as JSON.",
    defaultAccelerator: null,
    global: true
  },
  {
    action: "timer_toggle",
    label: "Show or hide timer",
    category: "timer",
    description: "Toggle the manual countdown visibility.",
    defaultAccelerator: null,
    global: true
  },
  {
    action: "timer_start_pause",
    label: "Start or pause timer",
    category: "timer",
    description: "Start a paused timer or pause a running timer.",
    defaultAccelerator: null,
    global: true
  },
  {
    action: "timer_reset",
    label: "Reset timer",
    category: "timer",
    description: "Reset the timer to its configured duration.",
    defaultAccelerator: null,
    global: true
  }
];

const SHORTCUT_ACTION_SET = new Set<ShortcutAction>(SHORTCUT_DEFINITIONS.map((definition) => definition.action));
const MODIFIER_ORDER = ["Ctrl", "Alt", "Shift", "Super"] as const;
const MODIFIER_SET = new Set<string>(["ctrl", "control", "cmdorctrl", "commandorcontrol", "alt", "option", "shift", "meta", "super", "win", "windows", "command", "cmd"]);
const KEY_ALIASES: Record<string, string> = {
  backspace: "Backspace",
  delete: "Delete",
  del: "Delete",
  space: "Space",
  spacebar: "Space",
  up: "ArrowUp",
  arrowup: "ArrowUp",
  down: "ArrowDown",
  arrowdown: "ArrowDown",
  left: "ArrowLeft",
  arrowleft: "ArrowLeft",
  right: "ArrowRight",
  arrowright: "ArrowRight",
  enter: "Enter",
  return: "Enter",
  tab: "Tab",
  escape: "Escape",
  esc: "Escape"
};
const DISPLAY_KEY_LABELS: Record<string, string> = {
  ArrowUp: "Up",
  ArrowDown: "Down",
  ArrowLeft: "Left",
  ArrowRight: "Right",
  Backspace: "Backspace",
  Delete: "Delete",
  Space: "Space",
  Enter: "Enter",
  Tab: "Tab",
  Escape: "Esc"
};
const DISPLAY_MODIFIER_LABELS: Record<(typeof MODIFIER_ORDER)[number], string> = {
  Ctrl: "Ctrl",
  Alt: "Alt",
  Shift: "Shift",
  Super: "Meta"
};

export function isShortcutAction(value: unknown): value is ShortcutAction {
  return typeof value === "string" && SHORTCUT_ACTION_SET.has(value as ShortcutAction);
}

export function getShortcutDefinition(action: ShortcutAction) {
  return SHORTCUT_DEFINITIONS.find((definition) => definition.action === action);
}

export function getShortcutBindingsByCategory(bindings: ShortcutBinding[], category: ShortcutCategory) {
  const definitions = SHORTCUT_DEFINITIONS.filter((definition) => definition.category === category);
  return definitions
    .map((definition) => bindings.find((binding) => binding.action === definition.action))
    .filter((binding): binding is ShortcutBinding => Boolean(binding));
}

export function buildDefaultShortcutBindings(): ShortcutBinding[] {
  return SHORTCUT_DEFINITIONS.map((definition) => ({
    action: definition.action,
    label: definition.label,
    accelerator: definition.defaultAccelerator,
    defaultAccelerator: definition.defaultAccelerator,
    global: definition.global,
    enabled: definition.defaultAccelerator !== null
  }));
}

function normalizeModifierToken(token: string) {
  const normalized = token.trim().toLowerCase();
  if (normalized === "ctrl" || normalized === "control" || normalized === "cmdorctrl" || normalized === "commandorcontrol") {
    return "Ctrl";
  }
  if (normalized === "alt" || normalized === "option") {
    return "Alt";
  }
  if (normalized === "shift") {
    return "Shift";
  }
  if (
    normalized === "meta" ||
    normalized === "super" ||
    normalized === "win" ||
    normalized === "windows" ||
    normalized === "command" ||
    normalized === "cmd"
  ) {
    return "Super";
  }

  return null;
}

function normalizeKeyToken(token: string) {
  const normalized = token.trim();
  if (!normalized) {
    return null;
  }

  if (/^F([1-9]|1[0-2])$/i.test(normalized)) {
    return normalized.toUpperCase();
  }

  if (/^[a-z]$/i.test(normalized)) {
    return normalized.toUpperCase();
  }

  if (/^[0-9]$/.test(normalized)) {
    return normalized;
  }

  const alias = KEY_ALIASES[normalized.toLowerCase()];
  if (alias) {
    return alias;
  }

  return null;
}

export function normalizeAcceleratorString(
  value: unknown,
  options: { requireModifier?: boolean } = {}
) {
  if (typeof value !== "string") {
    return null;
  }

  const tokens = value
    .split("+")
    .map((token) => token.trim())
    .filter(Boolean);

  if (tokens.length === 0) {
    return null;
  }

  const modifiers = new Set<(typeof MODIFIER_ORDER)[number]>();
  let key: string | null = null;

  for (const token of tokens) {
    const modifier = normalizeModifierToken(token);
    if (modifier) {
      modifiers.add(modifier);
      continue;
    }

    if (MODIFIER_SET.has(token.toLowerCase()) || key !== null) {
      return null;
    }

    key = normalizeKeyToken(token);
    if (!key) {
      return null;
    }
  }

  if (!key) {
    return null;
  }

  if (options.requireModifier !== false && modifiers.size === 0) {
    return null;
  }

  return [...MODIFIER_ORDER.filter((modifier) => modifiers.has(modifier)), key].join("+");
}

export function formatAcceleratorForDisplay(accelerator: string | null) {
  if (!accelerator) {
    return "Disabled";
  }

  return accelerator
    .split("+")
    .map((token) => DISPLAY_MODIFIER_LABELS[token as keyof typeof DISPLAY_MODIFIER_LABELS] ?? DISPLAY_KEY_LABELS[token] ?? token)
    .join("+");
}

export function normalizeShortcutBindings(input: unknown) {
  const fallback = buildDefaultShortcutBindings();
  const parsed = Array.isArray(input) ? input : [];
  const parsedMap = new Map<ShortcutAction, Partial<ShortcutBinding>>();

  for (const entry of parsed) {
    if (!entry || typeof entry !== "object") {
      continue;
    }

    const candidate = entry as Partial<ShortcutBinding>;
    if (!isShortcutAction(candidate.action)) {
      continue;
    }

    parsedMap.set(candidate.action, candidate);
  }

  const seenAccelerators = new Set<string>();

  return fallback.map((defaultBinding) => {
    const definition = getShortcutDefinition(defaultBinding.action);
    const candidate = parsedMap.get(defaultBinding.action);
    const hasExplicitAccelerator =
      candidate && Object.prototype.hasOwnProperty.call(candidate, "accelerator");
    const normalizedAccelerator = normalizeAcceleratorString(candidate?.accelerator, {
      requireModifier: definition?.global !== false
    });
    const requestedDisabled = candidate?.enabled === false || candidate?.accelerator === null;
    const explicitMalformedAccelerator =
      hasExplicitAccelerator && candidate?.accelerator !== null && candidate?.accelerator !== undefined && normalizedAccelerator === null;
    const enabled = requestedDisabled
      ? false
      : typeof candidate?.enabled === "boolean"
        ? candidate.enabled
        : defaultBinding.enabled;
    const accelerator = requestedDisabled
      ? null
      : normalizedAccelerator ?? (explicitMalformedAccelerator ? defaultBinding.accelerator : defaultBinding.accelerator);

    if (accelerator && seenAccelerators.has(accelerator.toLowerCase())) {
      return {
        ...defaultBinding,
        enabled: false,
        accelerator: null
      };
    }

    if (accelerator) {
      seenAccelerators.add(accelerator.toLowerCase());
    }

    return {
      ...defaultBinding,
      accelerator,
      enabled: accelerator !== null && enabled
    };
  });
}

export function getShortcutBinding(bindings: ShortcutBinding[], action: ShortcutAction) {
  return bindings.find((binding) => binding.action === action) ?? buildDefaultShortcutBindings().find((binding) => binding.action === action)!;
}

export function getShortcutToolAction(tool: ToolKind) {
  return SHORTCUT_DEFINITIONS.find((definition) => definition.tool === tool)?.action;
}

export function getToolShortcutLabel(bindings: ShortcutBinding[], tool: ToolKind) {
  const action = getShortcutToolAction(tool);
  if (!action) {
    return null;
  }

  const binding = getShortcutBinding(bindings, action);
  return binding.enabled ? formatAcceleratorForDisplay(binding.accelerator) : null;
}

export function getDuplicateShortcutAction(bindings: ShortcutBinding[], candidateAction: ShortcutAction, accelerator: string) {
  return bindings.find(
    (binding) =>
      binding.action !== candidateAction &&
      binding.enabled &&
      binding.accelerator?.toLowerCase() === accelerator.toLowerCase()
  );
}

export function captureShortcutFromKeyboardEvent(
  event: KeyboardEvent,
  options: { requireModifier?: boolean } = {}
): ShortcutRecordingResult {
  if (event.key === "Escape") {
    return { type: "cancel" };
  }

  if ((event.key === "Backspace" || event.key === "Delete") && !event.ctrlKey && !event.altKey && !event.shiftKey && !event.metaKey) {
    return { type: "clear" };
  }

  const modifierOnlyKeys = new Set(["Control", "Shift", "Alt", "Meta"]);
  if (modifierOnlyKeys.has(event.key)) {
    return { type: "ignore" };
  }

  const modifiers: string[] = [];
  if (event.ctrlKey) {
    modifiers.push("Ctrl");
  }
  if (event.altKey) {
    modifiers.push("Alt");
  }
  if (event.shiftKey) {
    modifiers.push("Shift");
  }
  if (event.metaKey) {
    modifiers.push("Super");
  }

  let keyToken: string | null = null;
  if (/^Key[A-Z]$/.test(event.code)) {
    keyToken = event.code.slice(3);
  } else if (/^Digit[0-9]$/.test(event.code)) {
    keyToken = event.code.slice(5);
  } else if (event.code === "Space") {
    keyToken = "Space";
  } else if (event.key.startsWith("Arrow")) {
    keyToken = event.key;
  } else if (event.key === "Backspace" || event.key === "Delete" || event.key === "Enter" || event.key === "Tab") {
    keyToken = event.key;
  } else if (/^F([1-9]|1[0-2])$/i.test(event.key)) {
    keyToken = event.key.toUpperCase();
  } else if (/^[a-z0-9]$/i.test(event.key)) {
    keyToken = event.key.toUpperCase();
  }

  if (!keyToken) {
    return { type: "invalid", message: "Use a letter, number, function key, Space, Backspace, or arrow key." };
  }

  const accelerator = [...modifiers, keyToken].join("+");
  const normalized = normalizeAcceleratorString(accelerator, { requireModifier: options.requireModifier !== false });

  if (!normalized) {
    return { type: "invalid", message: "Global shortcuts need at least one modifier and a supported key." };
  }

  return { type: "captured", accelerator: normalized };
}

export function getShortcutStatusMap(statuses: ShortcutRegistrationStatus[]) {
  return new Map(statuses.map((status) => [status.action, status]));
}
