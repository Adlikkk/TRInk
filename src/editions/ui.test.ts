import { describe, expect, it } from "vitest";
import { getEdition } from "./edition";
import {
  getEditionOverflowToolbarActions,
  getEditionPrimaryToolbarActions,
  getEditionSettingsTabs,
  getEditionToolbarToolIds
} from "./ui";

describe("edition UI config", () => {
  it("keeps the Basic toolbar limited to Basic tools and required actions", () => {
    const basic = getEdition("basic");

    expect(getEditionToolbarToolIds(basic)).toEqual([
      "select",
      "pen",
      "highlighter",
      "line",
      "arrow",
      "rectangle",
      "eraser"
    ]);
    expect(getEditionPrimaryToolbarActions(basic)).toEqual([
      "undo",
      "redo",
      "toggle-overlay-mode",
      "clear",
      "rotate-toolbar",
      "settings",
      "quit"
    ]);
    expect(getEditionOverflowToolbarActions(basic)).toEqual([]);
  });

  it("keeps the Basic settings tabs minimal", () => {
    const basic = getEdition("basic");
    expect(getEditionSettingsTabs(basic)).toEqual([
      "general",
      "tools",
      "keybinds",
      "appearance",
      "about"
    ]);
  });
});
