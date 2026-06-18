import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildEditionWindowTitle, buildInstallerFilename, createTauriConfig, getEditionBuildMetadata } from "./build-metadata";

const tauriBaseConfig = JSON.parse(
  readFileSync(new URL("../../src-tauri/tauri.conf.base.json", import.meta.url), "utf8")
);

describe("edition build metadata", () => {
  it("builds the correct basic metadata", () => {
    const basic = getEditionBuildMetadata("basic");
    expect(basic.productName).toBe("TRInk Basic");
    expect(basic.identifier).toBe("com.tradereality.trink.basic");
    expect(basic.version).toBe("0.1.0");
    expect(buildInstallerFilename(basic)).toBe("TRInk Basic_0.1.0_x64-setup.exe");
    expect(buildEditionWindowTitle(basic, "toolbar")).toBe("TRInk Basic Toolbar");
  });

  it("builds the correct trading metadata", () => {
    const trading = getEditionBuildMetadata("trading");
    expect(trading.productName).toBe("TradeReality Ink");
    expect(trading.identifier).toBe("com.tradereality.trink.trading");
    expect(trading.version).toBe("0.3.11");
    expect(buildInstallerFilename(trading)).toBe("TradeReality Ink_0.3.11_x64-setup.exe");
    expect(buildEditionWindowTitle(trading, "toolbar")).toBe("TRInk Trading Toolbar");
  });

  it("generates the correct tauri config for both editions", () => {
    const basicConfig = createTauriConfig(tauriBaseConfig, getEditionBuildMetadata("basic"));
    const tradingConfig = createTauriConfig(tauriBaseConfig, getEditionBuildMetadata("trading"));

    expect(basicConfig.productName).toBe("TRInk Basic");
    expect(basicConfig.version).toBe("0.1.0");
    expect(basicConfig.identifier).toBe("com.tradereality.trink.basic");
    expect(basicConfig.mainBinaryName).toBe("trink-basic");
    expect((basicConfig.app as { windows: Array<{ label: string; title: string }> }).windows.find((window) => window.label === "toolbar")?.title).toBe("TRInk Basic Toolbar");

    expect(tradingConfig.productName).toBe("TradeReality Ink");
    expect(tradingConfig.version).toBe("0.3.11");
    expect(tradingConfig.identifier).toBe("com.tradereality.trink.trading");
    expect(tradingConfig.mainBinaryName).toBe("trink");
    expect((tradingConfig.app as { windows: Array<{ label: string; title: string }> }).windows.find((window) => window.label === "toolbar")?.title).toBe("TRInk Trading Toolbar");
  });
});
