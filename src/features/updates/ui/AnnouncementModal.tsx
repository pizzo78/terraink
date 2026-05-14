import { useCallback, useEffect, useMemo, useState } from "react";
import { IoClose } from "react-icons/io5";
import { useAnnouncementRelease } from "@/features/updates/application/useAnnouncementRelease";
import type { UpdateCategory } from "@/features/updates/domain/types";

interface CategoryMeta {
  icon: string;
  label: string;
}

const categoryConfig: Record<UpdateCategory, CategoryMeta> = {
  new: { icon: "✨", label: "New" },
  fixed: { icon: "🛠️", label: "Fixed" },
  improved: { icon: "🚀", label: "Improved" },
  info: { icon: "ℹ️", label: "Info" },
  community: { icon: "👥", label: "Community" },
  docs: { icon: "📚", label: "Docs" },
  roadmap: { icon: "🎯", label: "Roadmap" },
  removed: { icon: "🗑️", label: "Removed" },
  security: { icon: "🔒", label: "Security" },
  breaking: { icon: "⚠️", label: "Breaking" },
  major: { icon: "👑", label: "Major" },
  perf: { icon: "⚡", label: "Performance" },
  core: { icon: "🧭", label: "Core" },
};

function toDisplayDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "long",
    day: "2-digit",
  }).format(date);
}

function renderPointText(text: string) {
  const separatorIndex = text.indexOf(":");
  if (separatorIndex <= 0) {
    return <span>{text}</span>;
  }

  const what = text.slice(0, separatorIndex).trim();
  const why = text.slice(separatorIndex + 1).trim();

  return (
    <span>
      <strong>{what}:</strong> {why}
    </span>
  );
}

export default function AnnouncementModal() {
  const { release, loading, markReleaseSeen, resolveImagePath } =
    useAnnouncementRelease();
  const [viewMode, setViewMode] = useState<"summary" | "details">("summary");
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!release) {
      return;
    }

    setViewMode("summary");
    setCurrentStep(0);
    setOpen(true);
  }, [release]);

  const closeModal = useCallback(() => {
    markReleaseSeen();
    setOpen(false);
  }, [markReleaseSeen]);

  const totalSteps = release?.steps.length ?? 0;
  const isDetailsMode = viewMode === "details";
  const isLastStep = totalSteps > 0 && currentStep === totalSteps - 1;
  const progressPercent = isDetailsMode
    ? totalSteps > 0
      ? Math.round(((currentStep + 1) / totalSteps) * 100)
      : 0
    : 0;
  const activeStep = useMemo(
    () => (release?.steps ? release.steps[currentStep] : null),
    [release, currentStep],
  );
  const summaryPoints = useMemo(() => {
    if (!release) {
      return [];
    }
    if (
      Array.isArray(release.summary?.points) &&
      release.summary.points.length > 0
    ) {
      return release.summary.points;
    }

    return release.steps.flatMap((step) => step.points).slice(0, 4);
  }, [release]);
  const summaryTitle = release?.summary?.title?.trim() || "Quick Highlights";
  const summaryHeaderTitle =
    release?.labels?.summaryTitle?.trim() || "What is new";
  const detailsHeaderTitle =
    release?.labels?.detailsTitle?.trim() || "Update Details";

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeModal();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [closeModal, open]);

  function handleNext() {
    if (!release) {
      return;
    }

    if (isLastStep) {
      closeModal();
      return;
    }

    setCurrentStep((value) => Math.min(value + 1, release.steps.length - 1));
  }

  function handleBack() {
    setCurrentStep((value) => Math.max(value - 1, 0));
  }

  if (
    !open ||
    !release ||
    (isDetailsMode && !activeStep) ||
    (viewMode === "summary" && summaryPoints.length === 0) ||
    loading
  ) {
    return null;
  }

  const resolvedImagePath =
    isDetailsMode && activeStep ? resolveImagePath(activeStep.image) : null;

  return (
    <div className="updates-modal-backdrop" role="presentation" onClick={closeModal}>
      <section
        className="updates-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="updates-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        {isDetailsMode ? (
          <div className="updates-modal-progress">
            <div
              className="updates-modal-progress-bar"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        ) : null}

        <button
          type="button"
          className="updates-modal-close"
          onClick={closeModal}
          aria-label="Close announcements"
        >
          <IoClose className="updates-modal-close-icon" />
        </button>

        <header className="updates-modal-header">
          <span className="updates-version-badge">Version {release.version}</span>
          <h2 id="updates-modal-title">
            {isDetailsMode ? detailsHeaderTitle : summaryHeaderTitle}
          </h2>
          <p className="updates-released-on">
            Released on {toDisplayDate(release.date)}
          </p>
        </header>

        <div className="updates-modal-content">
          <h3>{isDetailsMode ? activeStep?.title : summaryTitle}</h3>
          <ul className="updates-points">
            {(isDetailsMode && activeStep
              ? activeStep.points
              : summaryPoints
            ).map((point, index) => {
              const category =
                categoryConfig[point.type] ?? categoryConfig.improved;

              return (
                <li
                  key={`${point.type}-${index}`}
                  className={`updates-point updates-point--${point.type}`}
                >
                  <span className="updates-point-icon" aria-hidden="true">
                    {category.icon}
                  </span>
                  <div className="updates-point-text">
                    <span className="updates-point-label">{category.label}</span>
                    {renderPointText(point.text)}
                  </div>
                </li>
              );
            })}
          </ul>
          {isDetailsMode && resolvedImagePath ? (
            <img
              className="updates-step-image"
              src={resolvedImagePath}
              alt={`${activeStep.title} preview`}
            />
          ) : null}
        </div>

        <footer className="updates-modal-footer">
          <div className="updates-footer-row">
            <div className="updates-actions">
              {isDetailsMode ? (
                <>
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={currentStep === 0}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    className="updates-next-button"
                    onClick={handleNext}
                  >
                    {isLastStep ? "Finish" : "Next"}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="updates-next-button"
                    onClick={() => setViewMode("details")}
                  >
                    Show all details
                  </button>
                  <button
                    type="button"
                    className="updates-okay-button"
                    onClick={closeModal}
                  >
                    Okay, got it
                  </button>
                </>
              )}
            </div>
          </div>
        </footer>
      </section>
    </div>
  );
}
