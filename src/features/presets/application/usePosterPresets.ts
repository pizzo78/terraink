import { useCallback } from "react";
import { createPosterSnapshot } from "@/features/poster/application/posterReducer";
import { usePosterContext } from "@/features/poster/ui/PosterContext";
import { formatLayoutCm } from "@/features/layout/domain/layoutMatcher";
import { getLayoutOption } from "@/features/layout/infrastructure/layoutRepository";
import { normalizeExportSettings } from "@/features/export/domain/types";
import {
  getPosterPreset,
  posterPresets,
} from "@/features/presets/infrastructure/presetRepository";

export function usePosterPresets() {
  const { state, dispatch } = usePosterContext();

  const applyPreset = useCallback(
    (presetId: string) => {
      const preset = getPosterPreset(presetId);
      if (!preset) {
        return;
      }

      const layout = getLayoutOption(preset.layoutId);
      if (!layout) {
        return;
      }

      const snapshot = createPosterSnapshot(state);

      dispatch({
        type: "APPLY_POSTER_SNAPSHOT",
        snapshot: {
          ...snapshot,
          form: {
            ...snapshot.form,
            ...preset.form,
            layout: layout.id,
            width: formatLayoutCm(layout.widthCm),
            height: formatLayoutCm(layout.heightCm),
          },
          customColors: preset.form.theme ? {} : snapshot.customColors,
          exportSettings: normalizeExportSettings({
            ...snapshot.exportSettings,
            ...preset.exportSettings,
          }),
        },
      });
    },
    [dispatch, state],
  );

  return {
    presets: posterPresets,
    applyPreset,
  };
}
