import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import packageJson from "../../package.json";
import handoffCard from "../../tools-handoff/trink-tool-card.json";
import releaseManifest from "../../tools-handoff/trink-release-manifest.json";
import editionConfig from "../../config/edition-config.json";
import { buildInstallerFilename, getEditionBuildMetadata } from "../editions/build-metadata";
import { APP_BUILD_CHANNEL, APP_DISTRIBUTION, APP_EDITION_LABEL, APP_IDENTIFIER, APP_PRODUCT_NAME, APP_PUBLISHER, APP_SHORT_NAME, APP_VERSION } from "./app-meta";

function readScript(name: string) {
  return readFileSync(new URL(`../../scripts/${name}`, import.meta.url), "utf8");
}

describe("release metadata", () => {
  it("uses trading build metadata by default", () => {
    const trading = getEditionBuildMetadata("trading");
    expect(APP_VERSION).toBe(trading.version);
    expect(APP_PRODUCT_NAME).toBe("TradeReality Ink");
    expect(APP_SHORT_NAME).toBe("TRInk Trading");
    expect(APP_PUBLISHER).toBe("TradeReality");
    expect(APP_EDITION_LABEL).toBe("Trading");
    expect(APP_IDENTIFIER).toBe("com.tradereality.trink.trading");
    expect(["development", "beta"]).toContain(APP_BUILD_CHANNEL);
    expect(APP_DISTRIBUTION).toBe("TradeReality Tools");
  });

  it("keeps centralized edition build metadata valid", () => {
    const basic = getEditionBuildMetadata("basic");
    const trading = getEditionBuildMetadata("trading");
    expect(editionConfig.defaultEdition).toBe("trading");
    expect(basic.productName).toBe("TRInk Basic");
    expect(basic.version).toBe("0.1.0");
    expect(basic.identifier).toBe("com.tradereality.trink.basic");
    expect(buildInstallerFilename(basic)).toBe("TRInk Basic_0.1.0_x64-setup.exe");
    expect(basic.releaseFolder).toBe("TRInk-Basic-0.1.0-beta");
    expect(trading.productName).toBe("TradeReality Ink");
    expect(trading.version).toBe(packageJson.version);
    expect(trading.identifier).toBe("com.tradereality.trink.trading");
    expect(buildInstallerFilename(trading)).toBe("TradeReality Ink_0.3.11_x64-setup.exe");
    expect(trading.releaseFolder).toBe("TRInk-Trading-0.3.11-beta");
  });

  it("exposes internal and beta packaging scripts", () => {
    expect(packageJson.scripts["release:internal"]).toContain("package-internal-release.ps1");
    expect(packageJson.scripts["release:beta"]).toContain("package-beta-release.ps1");
    expect(packageJson.scripts["signing:check"]).toContain("docs/SIGNING.md");
  });

  it("keeps release scripts free of hardcoded local machine paths", () => {
    const sharedScript = readScript("package-release.ps1");
    const internalScript = readScript("package-internal-release.ps1");
    const betaScript = readScript("package-beta-release.ps1");

    for (const contents of [sharedScript, internalScript, betaScript]) {
      expect(contents).not.toMatch(/[A-Za-z]:\\\\/);
      expect(contents).not.toContain("/d:/");
      expect(contents).not.toContain("C:\\Users\\Adam");
    }
  });

  it("keeps the tools handoff card aligned with the beta release metadata", () => {
    const trading = getEditionBuildMetadata("trading");
    expect(handoffCard.id).toBe("trink");
    expect(handoffCard.name).toBe(trading.shortName);
    expect(handoffCard.fullName).toBe(trading.productName);
    expect(handoffCard.access).toBe("Registered users");
    expect(handoffCard.price).toBe("Free");
    expect(handoffCard.downloadFileName).toBe(buildInstallerFilename(trading));
  });

  it("keeps the release manifest aligned with the app and beta installer metadata", () => {
    const trading = getEditionBuildMetadata("trading");
    expect(releaseManifest.id).toBe("trink");
    expect(releaseManifest.name).toBe(trading.shortName);
    expect(releaseManifest.fullName).toBe(trading.productName);
    expect(releaseManifest.version).toBe(trading.version);
    expect(releaseManifest.channel).toBe("beta");
    expect(releaseManifest.access).toBe("registered_users");
    expect(releaseManifest.price).toBe("free");
    expect(releaseManifest.requiresLoginInsideApp).toBe(false);
    expect(releaseManifest.telemetryByDefault).toBe(false);
    expect(releaseManifest.cloudSync).toBe(false);
    expect(releaseManifest.brokerIntegration).toBe(false);
    expect(releaseManifest.tradingAutomation).toBe(false);
    expect(releaseManifest.installerFileName).toBe(buildInstallerFilename(trading));
    expect(releaseManifest.checksumFileName).toBe("CHECKSUMS.txt");
    expect(releaseManifest.logoFileName).toBe("logo.svg");
  });

  it("keeps installer asset paths relative and present in the repo", () => {
    const tauriConfig = JSON.parse(readFileSync(new URL("../../src-tauri/tauri.conf.json", import.meta.url), "utf8"));
    const nsisConfig = tauriConfig.bundle.windows.nsis;
    const assetPaths = [nsisConfig.headerImage, nsisConfig.sidebarImage, nsisConfig.installerIcon, tauriConfig.bundle.licenseFile];

    for (const assetPath of assetPaths) {
      expect(assetPath).not.toMatch(/^[A-Za-z]:\\/);
      expect(assetPath).not.toContain("/d:/");
      expect(existsSync(new URL(`../../src-tauri/${assetPath}`, import.meta.url))).toBe(true);
    }
  });

  it("does not hardcode the trading installer name for the basic release", () => {
    const basic = getEditionBuildMetadata("basic");
    const sharedScript = readScript("package-release.ps1");
    expect(sharedScript).toContain("config\\edition-config.json");
    expect(sharedScript).toContain("Expected installer");
    expect(buildInstallerFilename(basic)).toBe("TRInk Basic_0.1.0_x64-setup.exe");
  });

  it("packages TradeReality Tools handoff assets without adding app login/auth wiring", () => {
    const sharedScript = readScript("package-release.ps1");
    const toolbarSource = readFileSync(new URL("../components/Toolbar.tsx", import.meta.url), "utf8");
    const appSource = readFileSync(new URL("../App.tsx", import.meta.url), "utf8");
    const handoffFiles = [
      readFileSync(new URL("../../tools-handoff/trink-tool-card.md", import.meta.url), "utf8"),
      readFileSync(new URL("../../tools-handoff/trink-short-description.txt", import.meta.url), "utf8"),
      readFileSync(new URL("../../tools-handoff/trink-install-instructions.md", import.meta.url), "utf8"),
      readFileSync(new URL("../../tools-handoff/trink-faq.md", import.meta.url), "utf8"),
      readFileSync(new URL("../../tools-handoff/trink-changelog-summary.md", import.meta.url), "utf8")
    ];

    expect(sharedScript).toContain("tools-handoff");
    expect(toolbarSource).not.toMatch(/\b(auth|authenticate|oauth|signin|signIn|login)\b/i);
    expect(appSource).not.toMatch(/\b(authenticate|oauth|signin|signIn)\b/i);
    for (const contents of handoffFiles) {
      expect(contents).not.toMatch(/[A-Za-z]:\\\\/);
      expect(contents).not.toContain("/d:/");
    }
  });

  it("keeps Expiry out of user-facing handoff content", () => {
    const handoffDocs = [
      JSON.stringify(handoffCard),
      JSON.stringify(releaseManifest),
      readFileSync(new URL("../../tools-handoff/trink-tool-card.md", import.meta.url), "utf8"),
      readFileSync(new URL("../../tools-handoff/trink-faq.md", import.meta.url), "utf8")
    ];

    for (const contents of handoffDocs) {
      expect(contents).not.toMatch(/\bExpiry\b/);
    }
  });

  it("keeps Expiry and trading beta wording out of Basic docs", () => {
    const basicDocs = [
      readFileSync(new URL("../../README_BASIC.md", import.meta.url), "utf8"),
      readFileSync(new URL("../../RELEASE_NOTES_BASIC.md", import.meta.url), "utf8"),
      readFileSync(new URL("../../TESTING_BASIC.md", import.meta.url), "utf8")
    ];

    for (const contents of basicDocs) {
      expect(contents).not.toMatch(/\bExpiry\b/);
      expect(contents).not.toMatch(/\bTradeReality Tools\b/);
    }
  });
});
