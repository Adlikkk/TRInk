import packageJson from "../../package.json";

export const APP_VERSION = packageJson.version;
export const APP_PRODUCT_NAME = "TradeReality Ink";
export const APP_SHORT_NAME = "TRInk";
export const APP_PUBLISHER = "TradeReality";
export const APP_BUILD_CHANNEL =
  (import.meta.env.VITE_TRINK_BUILD_CHANNEL as string | undefined) ?? (import.meta.env.DEV ? "development" : "beta");
export const APP_DISTRIBUTION = "TradeReality Tools";
