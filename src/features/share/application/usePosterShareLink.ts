import { useCallback, useEffect, useRef, useState } from "react";
import { usePosterContext } from "@/features/poster/ui/PosterContext";
import {
  copyTextToClipboard,
  createPosterShareUrl,
} from "@/core/services";
import type { PosterState } from "@/features/poster/application/posterReducer";
import type {
  SharedMarker,
  SharedPosterPayload,
} from "@/features/share/domain/types";

const MAX_SHARED_MARKERS = 50;
const SHARE_STATUS_RESET_MS = 1800;

type ShareStatus = "idle" | "copied" | "failed";

function toRoundedCoordinate(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

function toShareableCoordinate(value: string): string {
  const numericValue = Number(value);
  return Number.isFinite(numericValue)
    ? String(toRoundedCoordinate(numericValue))
    : value;
}

function buildShareableMarkers(state: PosterState): SharedMarker[] {
  const customIconIds = new Set(state.customMarkerIcons.map((icon) => icon.id));

  return state.markers.slice(0, MAX_SHARED_MARKERS).map((marker) => ({
    lat: toRoundedCoordinate(marker.lat),
    lon: toRoundedCoordinate(marker.lon),
    iconId: customIconIds.has(marker.iconId) ? "pin" : marker.iconId,
    size: Math.round(marker.size),
    color: marker.color,
    label: marker.label,
  }));
}

function createSharedPosterPayload(state: PosterState): SharedPosterPayload {
  return {
    version: 1,
    form: {
      ...state.form,
      latitude: toShareableCoordinate(state.form.latitude),
      longitude: toShareableCoordinate(state.form.longitude),
    },
    customColors: state.customColors,
    markerDefaults: state.markerDefaults,
    exportSettings: state.exportSettings,
    markers: buildShareableMarkers(state),
  };
}

export function usePosterShareLink() {
  const { state } = usePosterContext();
  const [status, setStatus] = useState<ShareStatus>("idle");
  const resetTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  const copyShareLink = useCallback(async () => {
    try {
      const shareUrl = createPosterShareUrl(createSharedPosterPayload(state));
      await copyTextToClipboard(shareUrl);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }

    if (resetTimerRef.current !== null) {
      window.clearTimeout(resetTimerRef.current);
    }
    resetTimerRef.current = window.setTimeout(() => {
      setStatus("idle");
      resetTimerRef.current = null;
    }, SHARE_STATUS_RESET_MS);
  }, [state]);

  return {
    status,
    copyShareLink,
  };
}
