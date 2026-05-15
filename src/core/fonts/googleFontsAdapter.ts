import type { IFontLoader } from "./ports";

const fontLoaders: Record<string, () => Promise<unknown>> = {
  "bebas neue": () => import("@fontsource/bebas-neue/latin-400.css"),
  lato: () =>
    Promise.all([
      import("@fontsource/lato/latin-300.css"),
      import("@fontsource/lato/latin-400.css"),
      import("@fontsource/lato/latin-700.css"),
    ]),
  merriweather: () =>
    Promise.all([
      import("@fontsource/merriweather/latin-300.css"),
      import("@fontsource/merriweather/latin-400.css"),
      import("@fontsource/merriweather/latin-700.css"),
    ]),
  montserrat: () =>
    Promise.all([
      import("@fontsource/montserrat/latin-300.css"),
      import("@fontsource/montserrat/latin-400.css"),
      import("@fontsource/montserrat/latin-700.css"),
    ]),
  "noto sans jp": () =>
    Promise.all([
      import("@fontsource/noto-sans-jp/latin-300.css"),
      import("@fontsource/noto-sans-jp/latin-400.css"),
      import("@fontsource/noto-sans-jp/latin-700.css"),
    ]),
  oswald: () =>
    Promise.all([
      import("@fontsource/oswald/latin-300.css"),
      import("@fontsource/oswald/latin-400.css"),
      import("@fontsource/oswald/latin-700.css"),
    ]),
  "playfair display": () =>
    Promise.all([
      import("@fontsource/playfair-display/latin-400.css"),
      import("@fontsource/playfair-display/latin-700.css"),
    ]),
  raleway: () =>
    Promise.all([
      import("@fontsource/raleway/latin-300.css"),
      import("@fontsource/raleway/latin-400.css"),
      import("@fontsource/raleway/latin-700.css"),
    ]),
  "source sans pro": () =>
    Promise.all([
      import("@fontsource/source-sans-pro/latin-300.css"),
      import("@fontsource/source-sans-pro/latin-400.css"),
      import("@fontsource/source-sans-pro/latin-700.css"),
    ]),
};

const loadedFontKeys = new Set<string>();

export const googleFontsAdapter: IFontLoader = {
  async ensureFont(fontFamily: string): Promise<void> {
    const family = String(fontFamily ?? "").trim();
    if (!family) {
      return;
    }

    const fontKey = family.toLowerCase();
    const loadFont = fontLoaders[fontKey];
    if (loadFont && !loadedFontKeys.has(fontKey)) {
      await loadFont();
      loadedFontKeys.add(fontKey);
    }

    if (document.fonts?.load) {
      await Promise.allSettled([
        document.fonts.load(`300 16px "${family}"`),
        document.fonts.load(`400 16px "${family}"`),
        document.fonts.load(`700 16px "${family}"`),
      ]);
    }
  },
};
