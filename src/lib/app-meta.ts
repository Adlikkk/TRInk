import { getCurrentEdition } from "../editions/edition";
import { EDITION_PUBLISHER, getCurrentEditionBuildMetadata } from "../editions/build-metadata";

const edition = getCurrentEdition();
const buildMetadata = getCurrentEditionBuildMetadata();

export const APP_VERSION = buildMetadata.version;
export const APP_PRODUCT_NAME = buildMetadata.productName;
export const APP_SHORT_NAME = buildMetadata.shortName;
export const APP_PUBLISHER = EDITION_PUBLISHER;
export const APP_BUILD_CHANNEL =
  (import.meta.env.VITE_TRINK_BUILD_CHANNEL as string | undefined) ?? (import.meta.env.DEV ? "development" : "beta");
export const APP_DISTRIBUTION = buildMetadata.distribution;
export const APP_EDITION_LABEL = buildMetadata.editionLabel;
export const APP_IDENTIFIER = buildMetadata.identifier;
export const APP_EDITION = edition;
