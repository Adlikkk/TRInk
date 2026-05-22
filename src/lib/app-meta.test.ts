import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import packageJson from "../../package.json";
import handoffCard from "../../tools-handoff/trink-tool-card.json";
import releaseManifest from "../../tools-handoff/trink-release-manifest.json";
import { APP_BUILD_CHANNEL, APP_DISTRIBUTION, APP_PRODUCT_NAME, APP_PUBLISHER, APP_SHORT_NAME, APP_VERSION } from "./app-meta";

function readScript(name: string) {
  return readFileSync(new URL(`../../scripts/${name}`, import.meta.url), "utf8");
}

describe("release metadata", () => {
  it("keeps app version aligned with package metadata", () => {
    expect(APP_VERSION).toBe(packageJson.version);
    expect(packageJson.version).toBe("0.3.2");
    expect(APP_PRODUCT_NAME).toBe("TradeReality Ink");
    expect(APP_SHORT_NAME).toBe("TRInk");
    expect(APP_PUBLISHER).toBe("TradeReality");
    expect(["development", "beta"]).toContain(APP_BUILD_CHANNEL);
    expect(APP_DISTRIBUTION).toBe("TradeReality Tools");
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
    expect(handoffCard.id).toBe("trink");
    expect(handoffCard.name).toBe(APP_SHORT_NAME);
    expect(handoffCard.fullName).toBe(APP_PRODUCT_NAME);
    expect(handoffCard.access).toBe("Registered users");
    expect(handoffCard.price).toBe("Free");
    expect(handoffCard.downloadFileName).toBe("TradeReality Ink_0.3.2_x64-setup.exe");
  });

  it("keeps the release manifest aligned with the app and beta installer metadata", () => {
    expect(releaseManifest.id).toBe("trink");
    expect(releaseManifest.name).toBe(APP_SHORT_NAME);
    expect(releaseManifest.fullName).toBe(APP_PRODUCT_NAME);
    expect(releaseManifest.version).toBe(APP_VERSION);
    expect(releaseManifest.channel).toBe("beta");
    expect(releaseManifest.access).toBe("registered_users");
    expect(releaseManifest.price).toBe("free");
    expect(releaseManifest.requiresLoginInsideApp).toBe(false);
    expect(releaseManifest.telemetryByDefault).toBe(false);
    expect(releaseManifest.cloudSync).toBe(false);
    expect(releaseManifest.brokerIntegration).toBe(false);
    expect(releaseManifest.tradingAutomation).toBe(false);
    expect(releaseManifest.installerFileName).toBe("TradeReality Ink_0.3.2_x64-setup.exe");
    expect(releaseManifest.checksumFileName).toBe("CHECKSUMS.txt");
    expect(releaseManifest.logoFileName).toBe("logo.svg");
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
});
