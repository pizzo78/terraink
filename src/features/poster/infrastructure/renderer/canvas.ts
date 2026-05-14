import { MAX_PIXELS, MAX_SIDE, OUTPUT_DPI } from "./constants";
import type { CanvasSize } from "../../domain/types";

interface ResolveCanvasSizeOptions {
  outputDpi?: number;
  maxPixels?: number;
  maxSide?: number;
}

export function resolveCanvasSize(
  widthInches: number,
  heightInches: number,
  options: ResolveCanvasSizeOptions = {},
): CanvasSize {
  const outputDpi = normalizePositiveNumber(options.outputDpi, OUTPUT_DPI);
  const maxPixels = normalizePositiveNumber(options.maxPixels, MAX_PIXELS);
  const maxSide = normalizePositiveNumber(options.maxSide, MAX_SIDE);
  const requestedWidth = Math.max(600, Math.round(widthInches * outputDpi));
  const requestedHeight = Math.max(600, Math.round(heightInches * outputDpi));
  const totalPixels = requestedWidth * requestedHeight;

  const areaFactor =
    totalPixels > maxPixels ? Math.sqrt(maxPixels / totalPixels) : 1;
  const sideFactor =
    Math.max(requestedWidth, requestedHeight) > maxSide
      ? maxSide / Math.max(requestedWidth, requestedHeight)
      : 1;

  const factor = Math.min(areaFactor, sideFactor, 1);
  const width = Math.max(600, Math.round(requestedWidth * factor));
  const height = Math.max(600, Math.round(requestedHeight * factor));

  return {
    width,
    height,
    requestedWidth,
    requestedHeight,
    downscaleFactor: factor,
  };
}

function normalizePositiveNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
