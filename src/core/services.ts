/**
 * Pre-instantiated infrastructure services.
 *
 * Application hooks import from this module instead of calling concrete
 * adapters or browser APIs directly.
 */

import { localStorageCache } from "@/core/cache/localStorageCache";
import { fetchAdapter } from "@/core/http/fetchAdapter";
import { googleFontsAdapter } from "@/core/fonts/googleFontsAdapter";
import { createNominatimAdapter } from "@/features/location/infrastructure/nominatimAdapter";
import { createUpdateRepository } from "@/features/updates/infrastructure/updateRepository";

const nominatim = createNominatimAdapter(fetchAdapter, localStorageCache);
const updates = createUpdateRepository(fetchAdapter);

export const searchLocations = nominatim.searchLocations;
export const geocodeLocation = nominatim.geocodeLocation;
export const reverseGeocodeCoordinates = nominatim.reverseGeocode;

export const loadUpdateVersions = updates.loadUpdateVersions;
export const readLastSeenUpdateVersion = updates.readLastSeenUpdateVersion;
export const writeLastSeenUpdateVersion = updates.writeLastSeenUpdateVersion;
export const resolveUpdateImagePath = updates.resolveUpdateImagePath;

export const ensureGoogleFont =
  googleFontsAdapter.ensureFont.bind(googleFontsAdapter);

export {
  copyTextToClipboard,
  createPosterShareUrl,
  readPosterSharePayload,
} from "@/features/share/infrastructure/shareUrl";

export { compositeExport } from "@/features/poster/infrastructure/renderer";
export { resolveCanvasSize } from "@/features/poster/infrastructure/renderer/canvas";

export { captureMapAsCanvas } from "@/features/export/infrastructure/mapExporter";

export { createPngBlob } from "@/features/export/infrastructure/pngExporter";
export { createFlatSvgBlobFromCanvas } from "@/features/export/infrastructure/flatSvgExporter";
export { createLayeredSvgBlobFromMap } from "@/features/export/infrastructure/layeredSvgExporter";
export { createPdfBlobFromCanvas } from "@/features/export/infrastructure/pdfExporter";
export { createPosterFilename } from "@/features/export/infrastructure/filenameGenerator";
export {
  readPosterExportCount,
  writePosterExportCount,
} from "@/features/export/infrastructure/exportCountStorage";
export { triggerDownloadBlob } from "@/features/export/infrastructure/fileDownloader";
export { getAllMarkerIcons } from "@/features/markers/infrastructure/iconRegistry";
