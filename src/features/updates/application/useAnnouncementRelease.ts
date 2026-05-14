import { useCallback, useEffect, useState } from "react";
import { APP_VERSION, UPDATES_URL } from "@/core/config";
import {
  loadUpdateVersions,
  readLastSeenUpdateVersion,
  resolveUpdateImagePath,
  writeLastSeenUpdateVersion,
} from "@/core/services";
import type { UpdateVersion } from "@/features/updates/domain/types";
import { compareVersions } from "@/features/updates/domain/version";

interface UseAnnouncementReleaseReturn {
  release: UpdateVersion | null;
  loading: boolean;
  markReleaseSeen: () => void;
  resolveImagePath: (image: string | null) => string | null;
}

export function useAnnouncementRelease(): UseAnnouncementReleaseReturn {
  const [release, setRelease] = useState<UpdateVersion | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!APP_VERSION || !UPDATES_URL) {
      return undefined;
    }

    const lastSeenVersion = readLastSeenUpdateVersion();
    if (compareVersions(APP_VERSION, lastSeenVersion) <= 0) {
      return undefined;
    }

    const controller = new AbortController();

    async function loadCurrentRelease() {
      try {
        setLoading(true);
        const versions = await loadUpdateVersions(UPDATES_URL, controller.signal);
        const targetRelease = versions.find(
          (item) => item.version === APP_VERSION && Array.isArray(item.steps),
        );

        if (targetRelease) {
          setRelease(targetRelease);
        }
      } catch {
        // Silent fail: the announcement modal stays hidden when updates fail.
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadCurrentRelease();

    return () => {
      controller.abort();
    };
  }, []);

  const markReleaseSeen = useCallback(() => {
    writeLastSeenUpdateVersion(APP_VERSION);
  }, []);

  const resolveImagePath = useCallback((image: string | null) => {
    const origin =
      typeof window === "undefined" ? "" : window.location.origin;
    return resolveUpdateImagePath(image, UPDATES_URL, origin);
  }, []);

  return {
    release,
    loading,
    markReleaseSeen,
    resolveImagePath,
  };
}
