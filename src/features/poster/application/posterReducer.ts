import type { SearchResult } from "@/features/location/domain/types";
import type {
  MarkerDefaults,
  MarkerIconDefinition,
  MarkerItem,
} from "@/features/markers/domain/types";
import {
  MAX_MARKER_SIZE,
  MIN_MARKER_SIZE,
} from "@/features/markers/domain/constants";
import { createDefaultMarkerSettings } from "@/features/markers/infrastructure/helpers";
import {
  featuredMarkerIcons,
  predefinedMarkerIcons,
} from "@/features/markers/infrastructure/iconRegistry";
import {
  normalizeExportSettings,
  type ExportSettings,
} from "@/features/export/domain/types";
import { clamp } from "@/shared/geo/math";
import { DISPLAY_PALETTE_KEYS } from "@/features/theme/domain/types";
import type { SharedPosterPayload } from "@/features/share/domain/types";

const POSTER_FORM_SHARE_KEYS = new Set([
  "location",
  "latitude",
  "longitude",
  "distance",
  "width",
  "height",
  "theme",
  "layout",
  "displayCity",
  "displayCountry",
  "displayContinent",
  "fontFamily",
  "showPosterText",
  "includeCredits",
  "includeLandcover",
  "includeBuildings",
  "includeWater",
  "includeParks",
  "includeAeroway",
  "includeRail",
  "includeRoads",
  "includeRoadPath",
  "includeRoadMinorLow",
  "includeRoadOutline",
  "showMarkers",
  "showRoute",
]);
const POSTER_COLOR_SHARE_KEYS = new Set<string>(DISPLAY_PALETTE_KEYS);
const POSTER_MARKER_ICON_SHARE_KEYS = new Set(
  predefinedMarkerIcons.map((icon) => icon.id),
);
const HEX_COLOR_PATTERN = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

/* ────── Form state ────── */

export interface PosterForm {
  location: string;
  latitude: string;
  longitude: string;
  distance: string;
  width: string;
  height: string;
  theme: string;
  layout: string;
  displayCity: string;
  displayCountry: string;
  displayContinent: string;
  fontFamily: string;
  showPosterText: boolean;
  includeCredits: boolean;
  includeLandcover: boolean;
  includeBuildings: boolean;
  includeWater: boolean;
  includeParks: boolean;
  includeAeroway: boolean;
  includeRail: boolean;
  includeRoads: boolean;
  includeRoadPath: boolean;
  includeRoadMinorLow: boolean;
  includeRoadOutline: boolean;
  showMarkers: boolean;
  showRoute: boolean;
}

/* ────── App-level state ────── */

export interface PosterState {
  form: PosterForm;
  customColors: Record<string, string>;
  markers: MarkerItem[];
  customMarkerIcons: MarkerIconDefinition[];
  markerDefaults: MarkerDefaults;
  exportSettings: ExportSettings;
  isMarkerEditorActive: boolean;
  activeMarkerId: string | null;
  error: string;
  isExporting: boolean;
  isLocationFocused: boolean;
  selectedLocation: SearchResult | null;
  userLocation: SearchResult | null;
  displayNameOverrides: {
    city: boolean;
    country: boolean;
  };
}

/* ────── Actions ────── */

export type PosterAction =
  | { type: "SET_FIELD"; name: string; value: string | boolean }
  | {
      type: "SET_FORM_FIELDS";
      fields: Partial<PosterForm>;
      resetDisplayNameOverrides?: boolean;
    }
  | { type: "SET_THEME"; themeId: string }
  | { type: "SET_LAYOUT"; layoutId: string; widthCm: string; heightCm: string }
  | { type: "SET_COLOR"; key: string; value: string }
  | { type: "RESET_COLORS" }
  | { type: "SELECT_LOCATION"; location: SearchResult }
  | { type: "SET_USER_LOCATION"; location: SearchResult | null }
  | { type: "CLEAR_LOCATION" }
  | { type: "SET_LOCATION_FOCUSED"; focused: boolean }
  | { type: "SET_ERROR"; error: string }
  | { type: "SET_EXPORT_STATUS"; exporting: boolean; error?: string }
  | { type: "SET_MARKER_EDITOR_ACTIVE"; active: boolean }
  | { type: "SET_ACTIVE_MARKER"; markerId: string | null }
  | { type: "ADD_MARKER"; marker: MarkerItem }
  | { type: "ADD_MARKERS"; markers: MarkerItem[] }
  | { type: "UPDATE_MARKER"; markerId: string; changes: Partial<MarkerItem> }
  | { type: "REMOVE_MARKER"; markerId: string }
  | { type: "CLEAR_MARKERS" }
  | { type: "ADD_CUSTOM_MARKER_ICON"; icon: MarkerIconDefinition }
  | { type: "SET_CUSTOM_MARKER_ICONS"; icons: MarkerIconDefinition[] }
  | { type: "REMOVE_CUSTOM_MARKER_ICON"; iconId: string }
  | { type: "CLEAR_CUSTOM_MARKER_ICONS" }
  | {
      type: "SET_MARKER_DEFAULTS";
      defaults: Partial<MarkerDefaults>;
      applyToMarkers?: boolean;
    }
  | { type: "RESET_MARKER_DEFAULTS" }
  | { type: "SET_EXPORT_SETTINGS"; settings: Partial<ExportSettings> };

/* ────── Reducer ────── */

export function posterReducer(
  state: PosterState,
  action: PosterAction,
): PosterState {
  switch (action.type) {
    case "SET_FIELD": {
      const nextForm = { ...state.form, [action.name]: action.value };
      const nextDisplayNameOverrides = { ...state.displayNameOverrides };

      if (action.name === "location" && typeof action.value === "string") {
        nextDisplayNameOverrides.city = false;
        nextDisplayNameOverrides.country = false;
      }

      if (action.name === "latitude" || action.name === "longitude") {
        nextDisplayNameOverrides.city = false;
        nextDisplayNameOverrides.country = false;
      }

      if (action.name === "displayCity") {
        nextDisplayNameOverrides.city = true;
      }

      if (action.name === "displayCountry") {
        nextDisplayNameOverrides.country = true;
      }

      return {
        ...state,
        form: nextForm,
        displayNameOverrides: nextDisplayNameOverrides,
        // Clear selected location when location/lat/lon field changes
        ...(["location", "latitude", "longitude"].includes(action.name)
          ? { selectedLocation: null }
          : {}),
      };
    }

    case "SET_FORM_FIELDS":
      return {
        ...state,
        form: { ...state.form, ...action.fields },
        displayNameOverrides: action.resetDisplayNameOverrides
          ? { city: false, country: false }
          : state.displayNameOverrides,
      };

    case "SET_THEME":
      return {
        ...state,
        form: { ...state.form, theme: action.themeId },
        customColors: {},
      };

    case "SET_LAYOUT":
      return {
        ...state,
        form: {
          ...state.form,
          layout: action.layoutId,
          width: action.widthCm,
          height: action.heightCm,
        },
      };

    case "SET_COLOR":
      return {
        ...state,
        customColors: { ...state.customColors, [action.key]: action.value },
      };

    case "RESET_COLORS":
      return { ...state, customColors: {} };

    case "SELECT_LOCATION":
      return {
        ...state,
        selectedLocation: action.location,
        isLocationFocused: false,
        displayNameOverrides: { city: false, country: false },
        form: {
          ...state.form,
          location: action.location.label,
          latitude: action.location.lat.toFixed(6),
          longitude: action.location.lon.toFixed(6),
          displayCity: action.location.city,
          displayCountry: action.location.country,
          displayContinent: action.location.continent || "",
        },
      };

    case "SET_USER_LOCATION":
      return {
        ...state,
        userLocation: action.location,
      };

    case "CLEAR_LOCATION":
      return {
        ...state,
        selectedLocation: null,
        displayNameOverrides: { city: false, country: false },
        form: {
          ...state.form,
          location: "",
          displayCity: "",
          displayCountry: "",
          displayContinent: "",
        },
      };

    case "SET_LOCATION_FOCUSED":
      return { ...state, isLocationFocused: action.focused };

    case "SET_ERROR":
      return { ...state, error: action.error };

    case "SET_EXPORT_STATUS":
      return {
        ...state,
        isExporting: action.exporting,
        error: action.exporting ? "" : (action.error ?? state.error),
      };

    case "SET_MARKER_EDITOR_ACTIVE":
      return {
        ...state,
        isMarkerEditorActive: action.active,
        activeMarkerId: action.active ? state.activeMarkerId : null,
      };

    case "SET_ACTIVE_MARKER":
      return {
        ...state,
        activeMarkerId: action.markerId,
      };

    case "ADD_MARKER":
      return {
        ...state,
        markers: [...state.markers, action.marker],
      };

    case "ADD_MARKERS":
      return {
        ...state,
        form: { ...state.form, showMarkers: true },
        markers: [...state.markers, ...action.markers],
      };

    case "UPDATE_MARKER":
      return {
        ...state,
        markers: state.markers.map((marker) =>
          marker.id === action.markerId
            ? {
                ...marker,
                ...action.changes,
                id: marker.id,
                size:
                  typeof action.changes.size === "number"
                    ? clamp(action.changes.size, MIN_MARKER_SIZE, MAX_MARKER_SIZE)
                    : marker.size,
              }
            : marker,
        ),
      };

    case "REMOVE_MARKER":
      return {
        ...state,
        markers: state.markers.filter((marker) => marker.id !== action.markerId),
        activeMarkerId:
          state.activeMarkerId === action.markerId ? null : state.activeMarkerId,
      };

    case "CLEAR_MARKERS":
      return {
        ...state,
        markers: [],
        activeMarkerId: null,
        isMarkerEditorActive: false,
      };

    case "ADD_CUSTOM_MARKER_ICON":
      return {
        ...state,
        customMarkerIcons: [...state.customMarkerIcons, action.icon],
      };

    case "SET_CUSTOM_MARKER_ICONS":
      return {
        ...state,
        customMarkerIcons: action.icons,
      };

    case "REMOVE_CUSTOM_MARKER_ICON": {
      const fallbackIconId = featuredMarkerIcons[0]?.id ?? state.markers[0]?.iconId ?? "pin";
      return {
        ...state,
        customMarkerIcons: state.customMarkerIcons.filter(
          (icon) => icon.id !== action.iconId,
        ),
        markers: state.markers.map((marker) =>
          marker.iconId === action.iconId
            ? { ...marker, iconId: fallbackIconId }
            : marker,
        ),
      };
    }

    case "CLEAR_CUSTOM_MARKER_ICONS": {
      const fallbackIconId = featuredMarkerIcons[0]?.id ?? state.markers[0]?.iconId ?? "pin";
      const customIconIdSet = new Set(state.customMarkerIcons.map((icon) => icon.id));
      return {
        ...state,
        customMarkerIcons: [],
        markers: state.markers.map((marker) =>
          customIconIdSet.has(marker.iconId)
            ? { ...marker, iconId: fallbackIconId }
            : marker,
        ),
      };
    }

    case "SET_MARKER_DEFAULTS": {
      const hasSizeUpdate =
        typeof action.defaults.size === "number" &&
        Number.isFinite(action.defaults.size);
      const hasColorUpdate =
        typeof action.defaults.color === "string" &&
        action.defaults.color.trim().length > 0;
      const nextDefaults = {
        ...state.markerDefaults,
        ...(hasSizeUpdate
          ? {
              size: clamp(
                Number(action.defaults.size),
                MIN_MARKER_SIZE,
                MAX_MARKER_SIZE,
              ),
            }
          : {}),
        ...(hasColorUpdate ? { color: String(action.defaults.color) } : {}),
      };

      return {
        ...state,
        markerDefaults: nextDefaults,
        markers: action.applyToMarkers
          ? state.markers.map((marker) => ({
              ...marker,
              ...(hasSizeUpdate ? { size: nextDefaults.size } : {}),
              ...(hasColorUpdate ? { color: nextDefaults.color } : {}),
            }))
          : state.markers,
      };
    }

    case "RESET_MARKER_DEFAULTS": {
      const defaults = createDefaultMarkerSettings();
      return {
        ...state,
        markerDefaults: defaults,
        markers: state.markers.map((marker) => ({
          ...marker,
          size: defaults.size,
          color: defaults.color,
        })),
      };
    }

    case "SET_EXPORT_SETTINGS":
      return {
        ...state,
        exportSettings: normalizeExportSettings({
          ...state.exportSettings,
          ...action.settings,
        }),
      };

    default:
      return state;
  }
}

function normalizeSharedFormFields(
  fields: SharedPosterPayload["form"],
): Partial<PosterForm> {
  if (!fields || typeof fields !== "object") {
    return {};
  }

  const nextFields: Partial<PosterForm> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (
      POSTER_FORM_SHARE_KEYS.has(key) &&
      (typeof value === "string" || typeof value === "boolean")
    ) {
      (nextFields as Record<string, string | boolean>)[key] = value;
    }
  }

  return nextFields;
}

function normalizeSharedColors(
  colors: SharedPosterPayload["customColors"],
): Record<string, string> {
  if (!colors || typeof colors !== "object") {
    return {};
  }

  return Object.entries(colors).reduce<Record<string, string>>(
    (acc, [key, value]) => {
      const color = normalizeSharedHexColor(value);
      if (POSTER_COLOR_SHARE_KEYS.has(key) && color) {
        acc[key] = color;
      }
      return acc;
    },
    {},
  );
}

function normalizeSharedHexColor(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const color = value.trim();
  return HEX_COLOR_PATTERN.test(color) ? color : null;
}

function normalizeSharedMarkerIconId(value: unknown): string {
  const iconId = typeof value === "string" ? value.trim() : "";
  return POSTER_MARKER_ICON_SHARE_KEYS.has(iconId) ? iconId : "pin";
}

export function restoreSharedPosterState(
  state: PosterState,
  payload: SharedPosterPayload | null,
): PosterState {
  if (!payload) {
    return state;
  }

  const sharedMarkerDefaultColor = normalizeSharedHexColor(
    payload.markerDefaults?.color,
  );
  const markerDefaults = {
    ...state.markerDefaults,
    ...(typeof payload.markerDefaults?.size === "number"
      ? {
          size: clamp(
            payload.markerDefaults.size,
            MIN_MARKER_SIZE,
            MAX_MARKER_SIZE,
          ),
        }
      : {}),
    ...(sharedMarkerDefaultColor ? { color: sharedMarkerDefaultColor } : {}),
  };

  const markers = Array.isArray(payload.markers)
    ? payload.markers
        .map((marker, index): MarkerItem | null => {
          if (!marker || typeof marker !== "object") {
            return null;
          }

          const sharedMarker = marker as unknown as Record<string, unknown>;
          const lat = Number(sharedMarker.lat);
          const lon = Number(sharedMarker.lon);
          if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
            return null;
          }

          const markerSize = Number(sharedMarker.size);
          const markerColor = normalizeSharedHexColor(sharedMarker.color);
          const markerLabel =
            typeof sharedMarker.label === "string"
              ? sharedMarker.label.trim().slice(0, 80)
              : "";

          return {
            id: `shared-marker-${index}-${lat.toFixed(6)}-${lon.toFixed(6)}`,
            lat,
            lon,
            iconId: normalizeSharedMarkerIconId(sharedMarker.iconId),
            size: Number.isFinite(markerSize)
              ? clamp(markerSize, MIN_MARKER_SIZE, MAX_MARKER_SIZE)
              : markerDefaults.size,
            color: markerColor ?? markerDefaults.color,
            label: markerLabel || undefined,
          };
        })
        .filter((marker): marker is MarkerItem => marker !== null)
    : state.markers;

  return {
    ...state,
    form: {
      ...state.form,
      ...normalizeSharedFormFields(payload.form),
    },
    customColors: normalizeSharedColors(payload.customColors),
    markerDefaults,
    exportSettings: normalizeExportSettings(payload.exportSettings),
    markers,
    customMarkerIcons: [],
    isMarkerEditorActive: false,
    activeMarkerId: null,
    selectedLocation: null,
    userLocation: null,
    isLocationFocused: false,
    error: "",
    displayNameOverrides: {
      city: false,
      country: false,
    },
  };
}
