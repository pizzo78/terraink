import { useEffect, useState } from "react";
import { useExport } from "@/features/export/application/useExport";
import { usePosterShareLink } from "@/features/share/application/usePosterShareLink";
import {
  EXPORT_DPI_OPTIONS,
  type ExportDpi,
  type ExportFormat,
} from "@/features/export/domain/types";
import { CloseIcon, DownloadIcon, LinkIcon, LoaderIcon } from "@/shared/ui/Icons";
import SocialLinkGroup from "@/shared/ui/SocialLinkGroup";

const FORMAT_OPTIONS: { format: ExportFormat; label: string }[] = [
  { format: "png", label: "PNG" },
  { format: "pdf", label: "PDF" },
  { format: "svg", label: "SVG" },
];

const ADVANCED_FORMAT_OPTIONS: {
  format: ExportFormat;
  label: string;
  note: string;
}[] = [
  {
    format: "svg-layered",
    label: "Layered SVG",
    note: "Advanced, larger file",
  },
];

interface ExportFabProps {
  isMobile: boolean;
}

export default function ExportFab({ isMobile }: ExportFabProps) {
  const { isExporting, exportPoster, exportSettings, setExportSettings } =
    useExport();
  const {
    status: shareStatus,
    copyShareLink,
    markerLimitExceeded,
    sharedMarkerCount,
    totalMarkerCount,
    maxSharedMarkers,
  } = usePosterShareLink();
  const [isOpen, setIsOpen] = useState(false);
  const [activeFormat, setActiveFormat] = useState<ExportFormat | null>(null);
  const [isTriggerVisible, setIsTriggerVisible] = useState(true);

  useEffect(() => {
    if (!isExporting && activeFormat) {
      setActiveFormat(null);
      setIsOpen(false);
    }
  }, [isExporting, activeFormat]);

  useEffect(() => {
    if (!isMobile) return;

    const FOOTER_OVERLAP_THRESHOLD_PX = 140;

    const updateVisibility = () => {
      const doc = document.documentElement;
      const scrolledToBottom =
        window.scrollY + window.innerHeight >=
        doc.scrollHeight - FOOTER_OVERLAP_THRESHOLD_PX;
      setIsTriggerVisible(!scrolledToBottom);
    };

    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    window.addEventListener("resize", updateVisibility);
    return () => {
      window.removeEventListener("scroll", updateVisibility);
      window.removeEventListener("resize", updateVisibility);
    };
  }, [isMobile]);

  const runExport = (format: ExportFormat) => {
    setActiveFormat(format);
    void exportPoster(format);
  };

  const updatePrintNumber = (
    key: "marginMm" | "bleedMm" | "safeAreaMm",
    value: string,
  ) => {
    const nextValue = Number(value);
    if (key === "marginMm") {
      setExportSettings({ marginMm: nextValue });
      return;
    }
    if (key === "bleedMm") {
      setExportSettings({ bleedMm: nextValue });
      return;
    }
    setExportSettings({ safeAreaMm: nextValue });
  };

  const triggerClass = isMobile
    ? `mobile-export-fab-trigger${isTriggerVisible ? "" : " is-hidden"}`
    : "export-fab-trigger-desktop";

  return (
    <>
      <button
        type="button"
        className={triggerClass}
        aria-label="Export poster"
        title="Export poster"
        onClick={() => setIsOpen(true)}
        tabIndex={isMobile && !isTriggerVisible ? -1 : 0}
        aria-hidden={isMobile && !isTriggerVisible}
      >
        <DownloadIcon />
        {!isMobile && <span>Download</span>}
      </button>

      {isOpen ? (
        <div
          className="export-modal-backdrop"
          role="presentation"
          onClick={() => !isExporting && setIsOpen(false)}
        >
          <div
            className="export-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="export-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="export-modal-header">
              <h3 id="export-modal-title">Export Poster</h3>
              <button
                type="button"
                className="export-modal-close"
                onClick={() => !isExporting && setIsOpen(false)}
                aria-label="Close export options"
              >
                <CloseIcon />
              </button>
            </div>
            <div className="export-modal-actions">
              <div className="export-modal-print-panel">
                <div className="export-modal-dpi-group" role="group" aria-label="DPI">
                  {EXPORT_DPI_OPTIONS.map((dpi) => (
                    <button
                      key={dpi}
                      type="button"
                      className={`export-modal-dpi-btn${
                        exportSettings.dpi === dpi ? " is-active" : ""
                      }`}
                      aria-pressed={exportSettings.dpi === dpi}
                      onClick={() =>
                        setExportSettings({ dpi: dpi as ExportDpi })
                      }
                      disabled={isExporting}
                    >
                      <span>{dpi}</span>
                      <small>DPI</small>
                    </button>
                  ))}
                </div>
                <div className="export-modal-print-grid">
                  <label className="export-modal-print-field">
                    <span>Margin</span>
                    <input
                      type="number"
                      min="0"
                      max="30"
                      step="0.5"
                      value={exportSettings.marginMm}
                      onChange={(event) =>
                        updatePrintNumber("marginMm", event.target.value)
                      }
                      disabled={isExporting}
                    />
                    <small>mm</small>
                  </label>
                  <label className="export-modal-print-field">
                    <span>Bleed</span>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.5"
                      value={exportSettings.bleedMm}
                      onChange={(event) =>
                        updatePrintNumber("bleedMm", event.target.value)
                      }
                      disabled={isExporting}
                    />
                    <small>mm</small>
                  </label>
                  <label className="export-modal-print-field">
                    <span>Safe</span>
                    <input
                      type="number"
                      min="0"
                      max="30"
                      step="0.5"
                      value={exportSettings.safeAreaMm}
                      onChange={(event) =>
                        updatePrintNumber("safeAreaMm", event.target.value)
                      }
                      disabled={isExporting}
                    />
                    <small>mm</small>
                  </label>
                  <label className="export-modal-crop-field">
                    <input
                      type="checkbox"
                      checked={exportSettings.cropMarks}
                      onChange={(event) =>
                        setExportSettings({ cropMarks: event.target.checked })
                      }
                      disabled={isExporting}
                    />
                    <span>Crop</span>
                  </label>
                </div>
              </div>
              <button
                type="button"
                className={`export-modal-option export-modal-option--share${
                  shareStatus === "copied" ? " is-copied" : ""
                }${shareStatus === "limited" ? " is-limited" : ""}${
                  shareStatus === "failed" ? " is-failed" : ""
                }`}
                onClick={() => void copyShareLink()}
                disabled={isExporting}
              >
                <LinkIcon className="export-modal-option-icon" />
                <span>
                  {shareStatus === "copied"
                    ? "Copied"
                    : shareStatus === "limited"
                      ? `Copied ${sharedMarkerCount}/${totalMarkerCount}`
                    : shareStatus === "failed"
                      ? "Copy Failed"
                      : "Copy Link"}
                </span>
              </button>
              {markerLimitExceeded ? (
                <p className="export-modal-warning">
                  Share links include up to {maxSharedMarkers} markers. Only the
                  first {maxSharedMarkers} will be copied.
                </p>
              ) : null}
              {FORMAT_OPTIONS.map(({ format, label }) => (
                <button
                  key={format}
                  type="button"
                  className={`export-modal-option export-modal-option--${format}`}
                  onClick={() => runExport(format)}
                  disabled={isExporting}
                >
                  {isExporting && activeFormat === format ? (
                    <LoaderIcon className="export-modal-option-icon is-spinning" />
                  ) : (
                    <DownloadIcon className="export-modal-option-icon" />
                  )}
                  <span>{label}</span>
                </button>
              ))}
              <div className="export-modal-advanced">
                <p className="export-modal-advanced-label">Advanced</p>
                {ADVANCED_FORMAT_OPTIONS.map(({ format, label, note }) => (
                  <button
                    key={format}
                    type="button"
                    className="export-modal-option export-modal-option--svg-layered"
                    onClick={() => runExport(format)}
                    disabled={isExporting}
                  >
                    {isExporting && activeFormat === format ? (
                      <LoaderIcon className="export-modal-option-icon is-spinning" />
                    ) : (
                      <DownloadIcon className="export-modal-option-icon" />
                    )}
                    <span>{label}</span>
                    <small>{note}</small>
                  </button>
                ))}
              </div>
            </div>
            <p className="export-modal-support-label">
              Support the project <span className="heart">❤︎</span>
            </p>
            <SocialLinkGroup variant="mobile-export" />
          </div>
        </div>
      ) : null}
    </>
  );
}
