export type UpdateCategory =
  | "new"
  | "fixed"
  | "improved"
  | "info"
  | "community"
  | "docs"
  | "roadmap"
  | "removed"
  | "security"
  | "breaking"
  | "major"
  | "perf"
  | "core";

export interface UpdatePoint {
  type: UpdateCategory;
  text: string;
}

export interface UpdateStep {
  title: string;
  image: string | null;
  points: UpdatePoint[];
}

export interface UpdateSummary {
  title?: string;
  points: UpdatePoint[];
}

export interface UpdateLabels {
  summaryTitle?: string;
  detailsTitle?: string;
}

export interface UpdateVersion {
  version: string;
  date: string;
  labels?: UpdateLabels;
  summary?: UpdateSummary;
  steps: UpdateStep[];
}
