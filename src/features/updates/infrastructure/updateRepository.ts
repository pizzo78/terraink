import type { IHttp } from "@/core/http/ports";
import type { UpdateVersion } from "@/features/updates/domain/types";

const LAST_SEEN_VERSION_KEY = "last_seen_version";
const DEFAULT_LAST_SEEN_VERSION = "0.0.0";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isUpdateVersion(value: unknown): value is UpdateVersion {
  if (!isObject(value)) {
    return false;
  }

  return (
    typeof value.version === "string" &&
    typeof value.date === "string" &&
    Array.isArray(value.steps)
  );
}

function readLocalStorageValue(key: string): string | null {
  if (typeof window === "undefined" || !window.localStorage) {
    return null;
  }

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeLocalStorageValue(key: string, value: string): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore localStorage errors such as private mode or quota limits.
  }
}

export function createUpdateRepository(http: IHttp) {
  async function loadUpdateVersions(
    updatesUrl: string,
    signal?: AbortSignal,
  ): Promise<UpdateVersion[]> {
    const url = String(updatesUrl ?? "").trim();
    if (!url) {
      return [];
    }

    const response = await http.get(
      url,
      {
        cache: "no-store",
        headers: { Accept: "application/json" },
        signal,
      },
      16_000,
    );

    if (!response.ok) {
      return [];
    }

    const data: unknown = await response.json();
    if (!Array.isArray(data)) {
      return [];
    }

    return data.filter(isUpdateVersion);
  }

  function readLastSeenUpdateVersion(): string {
    return (
      readLocalStorageValue(LAST_SEEN_VERSION_KEY) ?? DEFAULT_LAST_SEEN_VERSION
    );
  }

  function writeLastSeenUpdateVersion(version: string): void {
    const normalizedVersion = String(version ?? "").trim();
    if (!normalizedVersion) {
      return;
    }

    writeLocalStorageValue(LAST_SEEN_VERSION_KEY, normalizedVersion);
  }

  function resolveUpdateImagePath(
    image: string | null,
    updatesUrl: string,
    origin: string,
  ): string | null {
    if (!image) {
      return null;
    }

    if (image.startsWith("http://") || image.startsWith("https://")) {
      return image;
    }

    try {
      const updatesBase = new URL(updatesUrl, origin);
      return new URL(image, updatesBase).toString();
    } catch {
      return image;
    }
  }

  return {
    loadUpdateVersions,
    readLastSeenUpdateVersion,
    writeLastSeenUpdateVersion,
    resolveUpdateImagePath,
  };
}
