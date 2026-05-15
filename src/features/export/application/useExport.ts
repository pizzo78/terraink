import { useCallback } from "react";
import { usePosterContext } from "@/features/poster/ui/PosterContext";
import {
  normalizeExportSettings,
  type ExportFormat,
  type ExportSettings,
} from "@/features/export/domain/types";
import {
  captureMapAsCanvas,
  compositeExport,
  createPngBlob,
  createPdfBlobFromCanvas,
  createFlatSvgBlobFromCanvas,
  createLayeredSvgBlobFromMap,
  createPosterFilename,
  ensureGoogleFont,
  getAllMarkerIcons,
  readPosterExportCount,
  resolveCanvasSize,
  triggerDownloadBlob,
  writePosterExportCount,
} from "@/core/services";
import {
  CM_PER_INCH,
  DEFAULT_POSTER_WIDTH_CM,
  DEFAULT_POSTER_HEIGHT_CM,
} from "@/core/config";

export type SupportPromptVariant = "first" | "milestone";

export interface SupportPromptState {
  posterNumber: number;
  variant: SupportPromptVariant;
}

export const SUPPORT_PROMPT_EVENT = "posterengine:support-prompt";

/**
 * Provides handlers for exporting the live poster preview as PNG or PDF.
 *
 * Flow:
 * 1. Resize MapLibre container to full export resolution.
 * 2. Wait for tiles at new resolution.
 * 3. Snapshot the WebGL canvas.
 * 4. Composite fades + text onto the snapshot.
 * 5. Download.
 */
export function useExport() {
  const { state, dispatch, effectiveTheme, mapRef } = usePosterContext();
  const { form } = state;
  const hasVisibleMarkers = form.showMarkers && state.markers.length > 0;
  const hasVisibleRoute = form.showMarkers && form.showRoute && state.markers.length > 1;
  const exportSettings = normalizeExportSettings(state.exportSettings);

  const registerSuccessfulExport = useCallback(() => {
    const nextCount = readPosterExportCount() + 1;
    writePosterExportCount(nextCount);

    let variant: SupportPromptVariant | null = null;
    if (nextCount === 1) variant = "first";
    else if (nextCount % 5 === 0) variant = "milestone";

    if (variant) {
      window.dispatchEvent(
        new CustomEvent(SUPPORT_PROMPT_EVENT, {
          detail: { posterNumber: nextCount, variant },
        }),
      );
    }
  }, []);

  const exportPoster = useCallback(
    async (
      format: ExportFormat,
      settingsOverride?: Partial<ExportSettings>,
    ) => {
      const map = mapRef.current;
      if (!map) {
        dispatch({ type: "SET_ERROR", error: "Map is not ready." });
        return;
      }

      dispatch({ type: "SET_EXPORT_STATUS", exporting: true });

      try {
        const settings = normalizeExportSettings({
          ...exportSettings,
          ...settingsOverride,
        });

        // Ensure font is loaded before compositing text
        if (form.showPosterText && form.fontFamily.trim()) {
          await ensureGoogleFont(form.fontFamily.trim());
        }

        const widthCm = Number(form.width) || DEFAULT_POSTER_WIDTH_CM;
        const heightCm = Number(form.height) || DEFAULT_POSTER_HEIGHT_CM;
        const widthInches = widthCm / CM_PER_INCH;
        const heightInches = heightCm / CM_PER_INCH;

        const size = resolveCanvasSize(widthInches, heightInches, {
          outputDpi: settings.dpi,
          maxPixels:
            settings.dpi === 600
              ? 32_000_000
              : settings.dpi === 300
                ? 12_000_000
                : 5_000_000,
          maxSide:
            settings.dpi === 600 ? 8192 : settings.dpi === 300 ? 5200 : 3600,
        });

        const lat = Number(form.latitude) || 0;
        const lon = Number(form.longitude) || 0;
        const textScale = (Number(form.textScale) || 100) / 100;

        if (format === "svg-layered") {
          const svgBlob = await createLayeredSvgBlobFromMap({
            map,
            exportWidth: size.width,
            exportHeight: size.height,
            theme: effectiveTheme,
            center: { lat, lon },
            displayCity: form.displayCity || form.location || "",
            displayCountry: form.displayCountry || "",
            fontFamily: form.fontFamily.trim(),
            showPosterText: form.showPosterText,
            showCoordinates: form.showCoordinates,
            textScale,
            showOverlay: form.showMarkers,
            showRoute: hasVisibleRoute,
            routeColor: effectiveTheme.ui.text,
            includeCredits: form.includeCredits,
            markers: hasVisibleMarkers ? state.markers : [],
            markerIcons: hasVisibleMarkers
              ? getAllMarkerIcons(state.customMarkerIcons)
              : [],
          });
          const svgFilename = createPosterFilename(
            form.displayCity || form.location,
            form.theme,
            "svg",
          );
          await triggerDownloadBlob(svgBlob, svgFilename);
          registerSuccessfulExport();
          dispatch({ type: "SET_EXPORT_STATUS", exporting: false });
          return;
        }

        // 1. Capture map at full export resolution
        const {
          canvas: mapCanvas,
          markerProjection,
          markerScaleX,
          markerScaleY,
          markerSizeScale,
        } = await captureMapAsCanvas(map, size.width, size.height);

        // 2. Composite fades + text
        const { canvas } = await compositeExport(mapCanvas, {
          theme: effectiveTheme,
          center: { lat, lon },
          widthInches,
          heightInches,
          displayCity: form.displayCity || form.location || "",
          displayCountry: form.displayCountry || "",
          fontFamily: form.fontFamily.trim(),
          showPosterText: form.showPosterText,
          showCoordinates: form.showCoordinates,
          textScale,
          showOverlay: form.showMarkers,
          showRoute: hasVisibleRoute,
          routeColor: effectiveTheme.ui.text,
          includeCredits: form.includeCredits,
          markers: hasVisibleMarkers ? state.markers : [],
          markerIcons: hasVisibleMarkers
            ? getAllMarkerIcons(state.customMarkerIcons)
            : [],
          markerProjection: hasVisibleMarkers ? markerProjection : undefined,
          markerScaleX: hasVisibleMarkers ? markerScaleX : undefined,
          markerScaleY: hasVisibleMarkers ? markerScaleY : undefined,
          markerSizeScale: hasVisibleMarkers ? markerSizeScale : undefined,
        });

        // 3. Download
        const filename = createPosterFilename(
          form.displayCity || form.location,
          form.theme,
          format,
        );

        if (format === "pdf") {
          const pdfBlob = await createPdfBlobFromCanvas(canvas, {
            widthCm,
            heightCm,
            marginMm: settings.marginMm,
            bleedMm: settings.bleedMm,
            safeAreaMm: settings.safeAreaMm,
            cropMarks: settings.cropMarks,
          });
          await triggerDownloadBlob(pdfBlob, filename);
        } else if (format === "svg") {
          const svgBlob = createFlatSvgBlobFromCanvas(canvas);
          await triggerDownloadBlob(svgBlob, filename);
        } else {
          const pngBlob = await createPngBlob(canvas, settings.dpi);
          await triggerDownloadBlob(pngBlob, filename);
        }

        registerSuccessfulExport();
        dispatch({ type: "SET_EXPORT_STATUS", exporting: false });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Export failed.";
        dispatch({ type: "SET_EXPORT_STATUS", exporting: false, error: message });
      }
    },
    [
      mapRef,
      form,
      effectiveTheme,
      exportSettings,
      dispatch,
      hasVisibleMarkers,
      hasVisibleRoute,
      registerSuccessfulExport,
      state.markers,
      state.customMarkerIcons,
    ],
  );

  const handleDownloadPng = useCallback(
    () => exportPoster("png"),
    [exportPoster],
  );

  const handleDownloadPdf = useCallback(
    () => exportPoster("pdf"),
    [exportPoster],
  );

  const handleDownloadSvg = useCallback(
    () => exportPoster("svg"),
    [exportPoster],
  );

  const exportPosterPack = useCallback(async () => {
    await exportPoster("pdf", {
      dpi: 300,
      marginMm: 0,
      bleedMm: 3,
      safeAreaMm: 5,
      cropMarks: true,
    });
    await exportPoster("png", {
      dpi: 150,
      marginMm: 0,
      bleedMm: 0,
      safeAreaMm: 0,
      cropMarks: false,
    });
    await exportPoster("svg");
  }, [exportPoster]);

  return {
    isExporting: state.isExporting,
    exportSettings,
    setExportSettings: (settings: Partial<ExportSettings>) =>
      dispatch({ type: "SET_EXPORT_SETTINGS", settings }),
    exportPoster,
    handleDownloadPng,
    handleDownloadPdf,
    handleDownloadSvg,
    exportPosterPack,
  };
}
