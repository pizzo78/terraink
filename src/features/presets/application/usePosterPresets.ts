import { useCallback } from "react";
import { usePosterContext } from "@/features/poster/ui/PosterContext";
import { formatLayoutCm } from "@/features/layout/domain/layoutMatcher";
import { getLayoutOption } from "@/features/layout/infrastructure/layoutRepository";
import {
  getPosterPreset,
  posterPresets,
} from "@/features/presets/infrastructure/presetRepository";

export function usePosterPresets() {
  const { dispatch } = usePosterContext();

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

      dispatch({
        type: "SET_FORM_FIELDS",
        fields: {
          ...preset.form,
          layout: layout.id,
          width: formatLayoutCm(layout.widthCm),
          height: formatLayoutCm(layout.heightCm),
        },
      });
      dispatch({
        type: "SET_EXPORT_SETTINGS",
        settings: preset.exportSettings,
      });
    },
    [dispatch],
  );

  return {
    presets: posterPresets,
    applyPreset,
  };
}
