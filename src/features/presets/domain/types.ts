import type { ExportSettings } from "@/features/export/domain/types";
import type { PosterForm } from "@/features/poster/application/posterReducer";

export interface PosterPreset {
  id: string;
  name: string;
  layoutId: string;
  form: Partial<PosterForm>;
  exportSettings: Partial<ExportSettings>;
}
