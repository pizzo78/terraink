import { useCallback, useState } from "react";
import { createPosterSnapshot } from "@/features/poster/application/posterReducer";
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

const VARIATION_RECIPES = [
  {
    name: "Gallery Print",
    description: "Portrait, print-safe spacing and classic title scale.",
    layoutId: "print_a4_portrait",
    fontFamily: "Playfair Display",
    distanceFactor: 1,
    textScale: "100",
  },
  {
    name: "Social Square",
    description: "Tighter crop with bold text for sharing.",
    layoutId: "social_instagram_square",
    fontFamily: "Montserrat",
    distanceFactor: 0.82,
    textScale: "108",
  },
  {
    name: "Story Poster",
    description: "Vertical mobile-first variant with larger typography.",
    layoutId: "social_instagram_story_tiktok",
    fontFamily: "Bebas neue",
    distanceFactor: 0.72,
    textScale: "112",
  },
  {
    name: "Desktop Wide",
    description: "Wide quiet crop for wallpaper or header use.",
    layoutId: "wallpaper_desktop_4k",
    fontFamily: "Lato",
    distanceFactor: 1.35,
    textScale: "92",
  },
  {
    name: "Mobile Clean",
    description: "No-friction mobile wallpaper composition.",
    layoutId: "wallpaper_iphone_15_pro",
    fontFamily: "Raleway",
    distanceFactor: 0.9,
    textScale: "94",
  },
  {
    name: "Editorial Feature",
    description: "Landscape composition with restrained map detail.",
    layoutId: "web_blog_featured",
    fontFamily: "Source Sans Pro",
    distanceFactor: 1.15,
    textScale: "96",
  },
];

export function usePosterVariations() {
  const { state, dispatch } = usePosterContext();
  const [variations, setVariations] = useState<PosterVariation[]>([]);

  const createVariations = useCallback(() => {
    const themeStart = Math.max(
      themeOptions.findIndex((theme) => theme.id === state.form.theme),
      0,
    );
    const baseDistance = Math.max(100, Number(state.form.distance) || 4000);
    const nextVariations = VARIATION_RECIPES.map((recipe, index) => {
      const layout =
        getLayoutOption(recipe.layoutId) ?? layoutOptions[index % layoutOptions.length];
      const theme =
        themeOptions[(themeStart + index + 1) % themeOptions.length] ??
        themeOptions.find((option) => option.id === defaultThemeName) ??
        themeOptions[0];

      if (!layout || !theme) {
        return null;
      }

      return {
        id: `${recipe.name}-${theme.id}-${layout.id}`,
        name: recipe.name,
        description: recipe.description,
        themeId: theme.id,
        themeName: theme.name,
        layoutId: layout.id,
        layoutName: layout.name,
        fontFamily: recipe.fontFamily,
        distance: String(Math.round(baseDistance * recipe.distanceFactor)),
        textScale: recipe.textScale,
      };
    }).filter((variation): variation is PosterVariation => variation !== null);

    setVariations(nextVariations);
  }, [state.form.distance, state.form.theme]);

  const applyVariation = useCallback(
    (variation: PosterVariation) => {
      const layout = getLayoutOption(variation.layoutId);
      if (!layout) {
        return;
      }

      const snapshot = createPosterSnapshot(state);
      dispatch({
        type: "APPLY_POSTER_SNAPSHOT",
        snapshot: {
          ...snapshot,
          customColors: {},
          form: {
            ...snapshot.form,
            theme: variation.themeId,
            layout: layout.id,
            width: formatLayoutCm(layout.widthCm),
            height: formatLayoutCm(layout.heightCm),
            fontFamily: variation.fontFamily,
            distance: variation.distance,
            textScale: variation.textScale,
          },
        },
      });
    },
    [dispatch, state],
  );

  return {
    variations,
    createVariations,
    applyVariation,
  };
}
