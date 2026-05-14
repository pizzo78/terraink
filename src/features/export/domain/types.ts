export type ExportFormat = "png" | "pdf" | "svg";

export type ExportDpi = 150 | 300 | 600;

export interface ExportSettings {
  dpi: ExportDpi;
  marginMm: number;
  bleedMm: number;
  safeAreaMm: number;
  cropMarks: boolean;
}

export interface ExportOptions {
  widthCm: number;
  heightCm: number;
  marginMm?: number;
  bleedMm?: number;
  safeAreaMm?: number;
  cropMarks?: boolean;
}

export const DEFAULT_EXPORT_SETTINGS: ExportSettings = {
  dpi: 300,
  marginMm: 0,
  bleedMm: 3,
  safeAreaMm: 5,
  cropMarks: true,
};

export const EXPORT_DPI_OPTIONS: ExportDpi[] = [150, 300, 600];

export function normalizeExportSettings(
  settings: Partial<ExportSettings> | null | undefined,
): ExportSettings {
  const dpi = EXPORT_DPI_OPTIONS.includes(settings?.dpi as ExportDpi)
    ? (settings?.dpi as ExportDpi)
    : DEFAULT_EXPORT_SETTINGS.dpi;

  return {
    dpi,
    marginMm: clampPrintMillimeters(
      settings?.marginMm,
      DEFAULT_EXPORT_SETTINGS.marginMm,
      0,
      30,
    ),
    bleedMm: clampPrintMillimeters(
      settings?.bleedMm,
      DEFAULT_EXPORT_SETTINGS.bleedMm,
      0,
      10,
    ),
    safeAreaMm: clampPrintMillimeters(
      settings?.safeAreaMm,
      DEFAULT_EXPORT_SETTINGS.safeAreaMm,
      0,
      30,
    ),
    cropMarks: settings?.cropMarks ?? DEFAULT_EXPORT_SETTINGS.cropMarks,
  };
}

function clampPrintMillimeters(
  value: unknown,
  fallback: number,
  min: number,
  max: number,
): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, Math.round(parsed * 10) / 10));
}
