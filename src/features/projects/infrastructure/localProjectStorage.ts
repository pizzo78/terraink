import type { PosterDesignSnapshot } from "@/features/poster/application/posterReducer";

const LOCAL_PROJECTS_KEY = "posterengine.localProjects.v1";
const MAX_LOCAL_PROJECTS = 12;

export interface LocalPosterProject {
  id: string;
  name: string;
  updatedAt: number;
  snapshot: PosterDesignSnapshot;
}

function isLocalProject(value: unknown): value is LocalPosterProject {
  if (!value || typeof value !== "object") {
    return false;
  }

  const project = value as Partial<LocalPosterProject>;
  return (
    typeof project.id === "string" &&
    typeof project.name === "string" &&
    typeof project.updatedAt === "number" &&
    Boolean(project.snapshot)
  );
}

export function readLocalProjects(): LocalPosterProject[] {
  try {
    const raw = window.localStorage.getItem(LOCAL_PROJECTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(isLocalProject) : [];
  } catch {
    return [];
  }
}

export function writeLocalProjects(projects: LocalPosterProject[]): void {
  const normalized = projects
    .filter(isLocalProject)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, MAX_LOCAL_PROJECTS);
  window.localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(normalized));
}

export function upsertLocalProject(
  projects: LocalPosterProject[],
  project: LocalPosterProject,
): LocalPosterProject[] {
  return [project, ...projects.filter((item) => item.id !== project.id)]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, MAX_LOCAL_PROJECTS);
}
