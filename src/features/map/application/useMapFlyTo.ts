import { useCallback } from "react";
import type { MapInstanceRef } from "@/features/map/domain/types";
import { distanceToZoom } from "@/features/map/application/useMapSync";
import {
  DEFAULT_CONTAINER_PX,
  FLY_TO_DURATION_MS,
  MAX_DISTANCE_METERS,
  MIN_DISTANCE_METERS,
} from "@/core/config";
import {
  MAP_OVERZOOM_SCALE,
  MAX_OVERZOOM_SCALE,
  MIN_EFFECTIVE_CONTAINER_PX,
} from "@/features/map/infrastructure/constants";
import { clamp } from "@/shared/geo/math";

function resolveEffectiveContainerPx(mapRef: MapInstanceRef): number {
  const map = mapRef.current;
  if (!map) {
    return DEFAULT_CONTAINER_PX;
  }

  const internalContainer = map.getContainer();
  const visibleContainer = internalContainer.parentElement;
  const visibleWidth =
    visibleContainer?.clientWidth ||
    Math.round(internalContainer.clientWidth / MAP_OVERZOOM_SCALE) ||
    DEFAULT_CONTAINER_PX;
  const overzoomScale = Math.min(
    MAX_OVERZOOM_SCALE,
    Math.max(MAP_OVERZOOM_SCALE, MIN_EFFECTIVE_CONTAINER_PX / visibleWidth),
  );

  return Math.max(1, visibleWidth * overzoomScale);
}

function resolveZoomBounds(
  latDeg: number,
  containerPx: number,
): { minZoom: number; maxZoom: number } {
  const minZoomFromDistance = distanceToZoom(
    MAX_DISTANCE_METERS,
    latDeg,
    containerPx,
  );
  const maxZoomFromDistance = distanceToZoom(
    MIN_DISTANCE_METERS,
    latDeg,
    containerPx,
  );

  return {
    minZoom: Math.min(minZoomFromDistance, maxZoomFromDistance),
    maxZoom: Math.max(minZoomFromDistance, maxZoomFromDistance),
  };
}

export function useMapFlyTo(
  distanceMeters: string,
  mapRef: MapInstanceRef,
): (lat: number, lon: number, keepCurrentZoom?: boolean) => void {
  return useCallback(
    (lat: number, lon: number, keepCurrentZoom = false) => {
      const map = mapRef.current;
      if (!map) {
        return;
      }

      const effectiveContainerPx = resolveEffectiveContainerPx(mapRef);
      const formDistance = clamp(
        Number(distanceMeters) || MIN_DISTANCE_METERS,
        MIN_DISTANCE_METERS,
        MAX_DISTANCE_METERS,
      );
      const bounds = resolveZoomBounds(lat, effectiveContainerPx);
      const zoom = keepCurrentZoom
        ? clamp(map.getZoom(), bounds.minZoom, bounds.maxZoom)
        : clamp(
            distanceToZoom(formDistance, lat, effectiveContainerPx),
            bounds.minZoom,
            bounds.maxZoom,
          );

      map.flyTo({
        center: [lon, lat],
        zoom,
        duration: FLY_TO_DURATION_MS,
      });
    },
    [distanceMeters, mapRef],
  );
}
