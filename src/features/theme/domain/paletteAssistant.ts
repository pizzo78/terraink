import {
  blendHex,
  hslToHexColor,
  normalizeHexColor,
  parseHex,
  rgbToHsl,
  shiftHexColor,
} from "@/shared/utils/color";
import type { ThemeColorKey } from "./types";

export function createAssistedPaletteOverrides(
  seedColor: string,
): Record<ThemeColorKey, string> {
  const seed = normalizeHexColor(seedColor) || "#4b91b7";
  const seedRgb = parseHex(seed);
  const seedHsl = seedRgb ? rgbToHsl(seedRgb) : { h: 0.56, s: 0.45, l: 0.5 };
  const textColor = hslToHexColor({
    h: seedHsl.h,
    s: Math.min(0.72, seedHsl.s + 0.08),
    l: seedHsl.l > 0.52 ? 0.16 : 0.88,
  });
  const land = blendHex(seed, "#f4efe7", 0.78);
  const landcover = blendHex(shiftHexColor(seed, { hShift: 0.08 }), "#e6eadc", 0.66);
  const water = shiftHexColor(seed, { hShift: 0.44, sShift: -0.08, lShift: 0.08 });
  const parks = shiftHexColor(seed, { hShift: 0.24, sShift: -0.02, lShift: 0.14 });
  const roadMajor = textColor;
  const roadMid = blendHex(textColor, land, 0.42);
  const roadLow = blendHex(textColor, land, 0.68);

  return {
    "ui.bg": land,
    "ui.text": textColor,
    "map.land": land,
    "map.landcover": landcover,
    "map.water": water,
    "map.waterway": blendHex(water, seed, 0.22),
    "map.parks": parks,
    "map.buildings": blendHex(seed, textColor, 0.18),
    "map.aeroway": blendHex(land, water, 0.32),
    "map.rail": blendHex(textColor, seed, 0.18),
    "map.roads.major": roadMajor,
    "map.roads.minor_high": blendHex(roadMajor, seed, 0.22),
    "map.roads.minor_mid": roadMid,
    "map.roads.minor_low": roadLow,
    "map.roads.path": blendHex(roadLow, parks, 0.3),
    "map.roads.outline": blendHex(land, textColor, 0.08),
  };
}
