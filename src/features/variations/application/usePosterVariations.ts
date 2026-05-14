import { useCallback, useState } from "react";
import { usePosterContext } from "@/features/poster/ui/PosterContext";
import { formatLayoutCm } from "@/features/layout/domain/layoutMatcher";
import {
  getLayoutOption,
  layoutOptions,
} from "@/features/layout/infrastructure/layoutRepository";
import {
  defaultThemeName,
  themeOptions,
} from "@/features/theme/infrastructure/themeRepository";
import type { PosterVariation } from "@/features/variations/domain/types";

const VARIATION_LAYOUT_IDS = [
  "print_a4_portrait",
  "social_instagram_square",
  "social_instagram_story_tiktok",
  "wallpaper_desktop_4k",
  "wallpaper_iphone_15_pro",
  "web_blog_featured",
];

export function usePosterVariations() {
  const { state, dispatch } = usePosterContext();
  const [variations, setVariations] = useState<PosterVariation[]>([]);

  const createVariations = useCallback(() => {
    const themeStart = Math.max(
      themeOptions.findIndex((theme) => theme.id === state.form.theme),
      0,
    );
    const nextVariations = VARIATION_LAYOUT_IDS.map((layoutId, index) => {
      const layout =
        getLayoutOption(layoutId) ?? layoutOptions[index % layoutOptions.length];
      const theme =
        themeOptions[(themeStart + index + 1) % themeOptions.length] ??
        themeOptions.find((option) => option.id === defaultThemeName) ??
        themeOptions[0];

      if (!layout || !theme) {
        return null;
      }

      return {
        id: `${theme.id}-${layout.id}`,
        themeId: theme.id,
        themeName: theme.name,
        layoutId: layout.id,
        layoutName: layout.name,
      };
    }).filter((variation): variation is PosterVariation => variation !== null);

    setVariations(nextVariations);
  }, [state.form.theme]);

  const applyVariation = useCallback(
    (variation: PosterVariation) => {
      const layout = getLayoutOption(variation.layoutId);
      if (!layout) {
        return;
      }

      dispatch({ type: "SET_THEME", themeId: variation.themeId });
      dispatch({
        type: "SET_LAYOUT",
        layoutId: layout.id,
        widthCm: formatLayoutCm(layout.widthCm),
        heightCm: formatLayoutCm(layout.heightCm),
      });
    },
    [dispatch],
  );

  return {
    variations,
    createVariations,
    applyVariation,
  };
}
