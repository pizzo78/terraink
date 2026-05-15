import type { PosterState } from "@/features/poster/application/posterReducer";
import type { ResolvedTheme } from "@/features/theme/domain/types";
import type { ExportSettings } from "@/features/export/domain/types";
import { CM_PER_INCH } from "@/core/config";
import { parseHex } from "@/shared/utils/color";

export type PreflightSeverity = "pass" | "warning" | "error";

export interface PreflightItem {
  id: string;
  label: string;
  detail: string;
  severity: PreflightSeverity;
}

export interface PreflightReport {
  status: PreflightSeverity;
  items: PreflightItem[];
}

function relativeLuminance(color: string): number | null {
  const rgb = parseHex(color);
  if (!rgb) {
    return null;
  }

  const normalize = (channel: number) => {
    const value = channel / 255;
    return value <= 0.03928
      ? value / 12.92
      : Math.pow((value + 0.055) / 1.055, 2.4);
  };

  return (
    0.2126 * normalize(rgb.r) +
    0.7152 * normalize(rgb.g) +
    0.0722 * normalize(rgb.b)
  );
}

function contrastRatio(foreground: string, background: string): number | null {
  const fg = relativeLuminance(foreground);
  const bg = relativeLuminance(background);
  if (fg === null || bg === null) {
    return null;
  }

  const lighter = Math.max(fg, bg);
  const darker = Math.min(fg, bg);
  return (lighter + 0.05) / (darker + 0.05);
}

function createItem(
  id: string,
  label: string,
  detail: string,
  severity: PreflightSeverity,
): PreflightItem {
  return { id, label, detail, severity };
}

export function buildPreflightReport(
  state: PosterState,
  theme: ResolvedTheme,
  settings: ExportSettings,
): PreflightReport {
  const widthCm = Number(state.form.width);
  const heightCm = Number(state.form.height);
  const lat = Number(state.form.latitude);
  const lon = Number(state.form.longitude);
  const estimatedMegapixels =
    Number.isFinite(widthCm) && Number.isFinite(heightCm)
      ? ((widthCm / CM_PER_INCH) * settings.dpi * (heightCm / CM_PER_INCH) * settings.dpi) /
        1_000_000
      : 0;
  const contrast = contrastRatio(theme.ui.text, theme.ui.bg);

  const items: PreflightItem[] = [
    Number.isFinite(widthCm) && Number.isFinite(heightCm) && widthCm > 0 && heightCm > 0
      ? createItem(
          "size",
          "Size",
          `${widthCm} x ${heightCm} cm at ${settings.dpi} DPI`,
          "pass",
        )
      : createItem("size", "Size", "Poster dimensions are invalid.", "error"),
    estimatedMegapixels <= 32
      ? createItem(
          "pixels",
          "Render Load",
          `${estimatedMegapixels.toFixed(1)} MP estimated export surface`,
          estimatedMegapixels > 18 ? "warning" : "pass",
        )
      : createItem(
          "pixels",
          "Render Load",
          `${estimatedMegapixels.toFixed(1)} MP may be too heavy for the browser.`,
          "error",
        ),
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lon) <= 180
      ? createItem("location", "Location", "Coordinates are valid.", "pass")
      : createItem("location", "Location", "Coordinates are outside valid ranges.", "error"),
    state.form.showPosterText && contrast !== null && contrast < 3
      ? createItem(
          "contrast",
          "Text Contrast",
          `Text contrast is ${contrast.toFixed(1)}:1. Increase contrast for print.`,
          "warning",
        )
      : createItem("contrast", "Text Contrast", "Poster text contrast is usable.", "pass"),
    state.form.showRoute && state.markers.length < 2
      ? createItem("route", "Route", "Route needs at least two markers.", "warning")
      : createItem(
          "route",
          "Route",
          state.form.showRoute
            ? `${state.markers.length} route waypoints ready.`
            : "Route is disabled.",
          "pass",
        ),
    settings.cropMarks && settings.bleedMm <= 0
      ? createItem("bleed", "Bleed", "Crop marks work best with bleed enabled.", "warning")
      : createItem("bleed", "Bleed", "Print bleed settings are coherent.", "pass"),
  ];

  const status = items.some((item) => item.severity === "error")
    ? "error"
    : items.some((item) => item.severity === "warning")
      ? "warning"
      : "pass";

  return { status, items };
}
