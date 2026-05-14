import { localStorageCache } from "@/core/cache/localStorageCache";

const EXPORT_COUNT_STORAGE_KEY = "posterengine.poster.count";
const EXPORT_COUNT_TTL_MS = 365 * 24 * 60 * 60 * 1000;

export function readPosterExportCount(): number {
  const stored = localStorageCache.read<number>(
    EXPORT_COUNT_STORAGE_KEY,
    EXPORT_COUNT_TTL_MS,
  );

  if (typeof stored === "number" && Number.isFinite(stored) && stored >= 0) {
    return Math.floor(stored);
  }

  return 0;
}

export function writePosterExportCount(nextCount: number): void {
  localStorageCache.write(EXPORT_COUNT_STORAGE_KEY, nextCount);
}
