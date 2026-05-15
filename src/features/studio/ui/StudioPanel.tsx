import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  createPosterSnapshot,
  type PosterSeriesItem,
} from "@/features/poster/application/posterReducer";
import { usePosterContext } from "@/features/poster/ui/PosterContext";
import { usePosterPresets } from "@/features/presets/application/usePosterPresets";
import { usePosterVariations } from "@/features/variations/application/usePosterVariations";
import { buildPreflightReport } from "@/features/preflight/domain/preflight";
import {
  readLocalProjects,
  upsertLocalProject,
  writeLocalProjects,
  type LocalPosterProject,
} from "@/features/projects/infrastructure/localProjectStorage";
import {
  ArchiveIcon,
  BoxIcon,
  CheckIcon,
  SaveIcon,
  ShuffleIcon,
  TrashIcon,
} from "@/shared/ui/Icons";

function createTimestampId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function formatDate(value: number): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getPosterName(city: string, fallback: string, count = 1): string {
  const base = [city, fallback].find((value) => value.trim())?.trim() || "Poster";
  return count > 1 ? `${base} ${count}` : base;
}

export default function StudioPanel() {
  const { state, dispatch, effectiveTheme } = usePosterContext();
  const { presets, applyPreset } = usePosterPresets();
  const { variations, createVariations, applyVariation } = usePosterVariations();
  const [projects, setProjects] = useState<LocalPosterProject[]>([]);

  const preflight = useMemo(
    () => buildPreflightReport(state, effectiveTheme, state.exportSettings),
    [state, effectiveTheme],
  );

  useEffect(() => {
    setProjects(readLocalProjects());
  }, []);

  const addSeriesItem = () => {
    const item: PosterSeriesItem = {
      id: createTimestampId("series"),
      name: getPosterName(
        state.form.displayCity,
        state.form.location,
        state.seriesItems.length + 1,
      ),
      createdAt: Date.now(),
      snapshot: createPosterSnapshot(state),
    };
    dispatch({ type: "ADD_SERIES_ITEM", item });
  };

  const saveProject = () => {
    const project: LocalPosterProject = {
      id: createTimestampId("project"),
      name: getPosterName(state.form.displayCity, state.form.location),
      updatedAt: Date.now(),
      snapshot: createPosterSnapshot(state),
    };
    const nextProjects = upsertLocalProject(projects, project);
    writeLocalProjects(nextProjects);
    setProjects(nextProjects);
  };

  const deleteProject = (projectId: string) => {
    const nextProjects = projects.filter((project) => project.id !== projectId);
    writeLocalProjects(nextProjects);
    setProjects(nextProjects);
  };

  return (
    <section className="panel-block studio-panel" aria-label="Poster studio">
      <StudioBlock
        title="Poster Series"
        icon={<ArchiveIcon />}
        actionLabel="Add Current"
        onAction={addSeriesItem}
      >
        {state.seriesItems.length > 0 ? (
          <div className="studio-list">
            {state.seriesItems.map((item) => (
              <article key={item.id} className="studio-list-item">
                <button
                  type="button"
                  className="studio-list-main"
                  onClick={() =>
                    dispatch({
                      type: "APPLY_POSTER_SNAPSHOT",
                      snapshot: item.snapshot,
                    })
                  }
                >
                  <span>{item.name}</span>
                  <small>{formatDate(item.createdAt)}</small>
                </button>
                <button
                  type="button"
                  className="studio-icon-btn"
                  aria-label={`Remove ${item.name}`}
                  onClick={() =>
                    dispatch({ type: "REMOVE_SERIES_ITEM", itemId: item.id })
                  }
                >
                  <TrashIcon />
                </button>
              </article>
            ))}
          </div>
        ) : (
          <p className="studio-empty">No series items.</p>
        )}
      </StudioBlock>

      <StudioBlock
        title="Variations"
        icon={<ShuffleIcon />}
        actionLabel="Generate"
        onAction={createVariations}
      >
        {variations.length > 0 ? (
          <div className="studio-grid">
            {variations.map((variation) => (
              <button
                key={variation.id}
                type="button"
                className="studio-card-btn"
                onClick={() => applyVariation(variation)}
              >
                <span>{variation.name}</span>
                <small>
                  {variation.themeName} / {variation.layoutName}
                </small>
              </button>
            ))}
          </div>
        ) : (
          <p className="studio-empty">No variants yet.</p>
        )}
      </StudioBlock>

      <StudioBlock title="Preflight" icon={<CheckIcon />}>
        <div className={`preflight-summary preflight-summary--${preflight.status}`}>
          <span>{preflight.status === "pass" ? "Ready" : preflight.status}</span>
          <small>{preflight.items.length} checks</small>
        </div>
        <div className="studio-list">
          {preflight.items.map((item) => (
            <article
              key={item.id}
              className={`studio-list-item preflight-item preflight-item--${item.severity}`}
            >
              <div className="studio-list-main">
                <span>{item.label}</span>
                <small>{item.detail}</small>
              </div>
            </article>
          ))}
        </div>
      </StudioBlock>

      <StudioBlock title="Curated Presets" icon={<BoxIcon />}>
        <div className="studio-grid">
          {presets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className="studio-card-btn"
              onClick={() => applyPreset(preset.id)}
            >
              <span>{preset.name}</span>
              <small>{preset.description}</small>
            </button>
          ))}
        </div>
      </StudioBlock>

      <StudioBlock
        title="Local Projects"
        icon={<SaveIcon />}
        actionLabel="Save Current"
        onAction={saveProject}
      >
        {projects.length > 0 ? (
          <div className="studio-list">
            {projects.map((project) => (
              <article key={project.id} className="studio-list-item">
                <button
                  type="button"
                  className="studio-list-main"
                  onClick={() =>
                    dispatch({
                      type: "APPLY_POSTER_SNAPSHOT",
                      snapshot: project.snapshot,
                    })
                  }
                >
                  <span>{project.name}</span>
                  <small>{formatDate(project.updatedAt)}</small>
                </button>
                <button
                  type="button"
                  className="studio-icon-btn"
                  aria-label={`Delete ${project.name}`}
                  onClick={() => deleteProject(project.id)}
                >
                  <TrashIcon />
                </button>
              </article>
            ))}
          </div>
        ) : (
          <p className="studio-empty">No local projects.</p>
        )}
      </StudioBlock>
    </section>
  );
}

function StudioBlock({
  title,
  icon,
  actionLabel,
  onAction,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  children: ReactNode;
}) {
  return (
    <div className="studio-block">
      <div className="studio-block-head">
        <div className="studio-block-title">
          {icon}
          <h3>{title}</h3>
        </div>
        {actionLabel && onAction ? (
          <button type="button" className="studio-small-btn" onClick={onAction}>
            {actionLabel}
          </button>
        ) : null}
      </div>
      {children}
    </div>
  );
}
