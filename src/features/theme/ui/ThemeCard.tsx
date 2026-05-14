import {
  DISPLAY_PALETTE_KEYS,
  type ThemeOption,
  type ThemeColorKey,
} from "../domain/types";
import type { CSSProperties } from "react";

interface ThemeCardProps {
  themeOption: ThemeOption | null;
  onClick?: () => void;
  isSelected?: boolean;
  showFullPalette?: boolean;
}

export default function ThemeCard({
  themeOption,
  onClick,
  isSelected = false,
  showFullPalette = false,
}: ThemeCardProps) {
  if (!themeOption) {
    return null;
  }

  const majorPaletteKeys: ThemeColorKey[] = showFullPalette
    ? DISPLAY_PALETTE_KEYS
    : [
        "ui.text",
        "map.land",
        "map.roads.major",
        "map.roads.minor_high",
        "map.roads.minor_mid",
      ];
  const majorPaletteIndices = majorPaletteKeys
    .map((key) => DISPLAY_PALETTE_KEYS.indexOf(key))
    .filter((index) => index >= 0);
  const palette = (() => {
    if (!Array.isArray(themeOption.palette)) return [];
    const seen = new Set<string>();
    const result: string[] = [];
    for (const index of majorPaletteIndices) {
      const color = themeOption.palette[index];
      if (color && !seen.has(color)) {
        seen.add(color);
        result.push(color);
      }
    }
    return result;
  })();
  const paletteByKey = (key: ThemeColorKey, fallback: string) => {
    const color = themeOption.palette?.[DISPLAY_PALETTE_KEYS.indexOf(key)];
    return color || fallback;
  };
  const previewStyle = {
    "--theme-preview-land": paletteByKey("map.land", "#d8d3c6"),
    "--theme-preview-landcover": paletteByKey("map.landcover", "#cfd7c2"),
    "--theme-preview-water": paletteByKey("map.water", "#8fbfd0"),
    "--theme-preview-parks": paletteByKey("map.parks", "#b8cf9f"),
    "--theme-preview-buildings": paletteByKey("map.buildings", "#b8aa9d"),
    "--theme-preview-road-major": paletteByKey("map.roads.major", "#ffffff"),
    "--theme-preview-road-mid": paletteByKey("map.roads.minor_mid", "#e6e6e6"),
    "--theme-preview-text": paletteByKey("ui.text", "#111111"),
  } as CSSProperties;
  const className = ["theme-card", isSelected ? "is-selected" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      className={className}
      onClick={onClick}
      aria-pressed={isSelected}
      aria-label={themeOption.name}
    >
      <div className="theme-card-preview" style={previewStyle} aria-hidden="true">
        <span className="theme-preview-water" />
        <span className="theme-preview-park theme-preview-park--one" />
        <span className="theme-preview-park theme-preview-park--two" />
        <span className="theme-preview-building theme-preview-building--one" />
        <span className="theme-preview-building theme-preview-building--two" />
        <span className="theme-preview-building theme-preview-building--three" />
        <span className="theme-preview-road theme-preview-road--major" />
        <span className="theme-preview-road theme-preview-road--mid" />
        <span className="theme-preview-road theme-preview-road--minor" />
      </div>
      {showFullPalette ? (
        <div className="theme-card-palette theme-card-palette--full" aria-hidden="true">
          {palette.map((color, index) => (
            <span
              key={`${themeOption.id}-${color}-${index}`}
              className="theme-card-swatch"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      ) : null}
      <span className="theme-card-name-shadow" aria-hidden="true" />
      <p className="theme-card-name">{themeOption.name}</p>
    </button>
  );
}
