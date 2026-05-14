import { usePosterPresets } from "@/features/presets/application/usePosterPresets";
import { usePosterVariations } from "@/features/variations/application/usePosterVariations";

export default function PresetQuickBar() {
  const { presets, applyPreset } = usePosterPresets();
  const { variations, createVariations, applyVariation } = usePosterVariations();

  return (
    <section className="panel-block preset-quick-bar" aria-label="Quick presets">
      <div className="preset-quick-grid">
        {presets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className="preset-quick-btn"
            onClick={() => applyPreset(preset.id)}
          >
            <span>{preset.name}</span>
          </button>
        ))}
      </div>
      <button
        type="button"
        className="preset-variation-trigger"
        onClick={createVariations}
      >
        Create Variations
      </button>
      {variations.length > 0 ? (
        <div className="preset-variation-grid" aria-label="Generated variations">
          {variations.map((variation) => (
            <button
              key={variation.id}
              type="button"
              className="preset-variation-btn"
              onClick={() => applyVariation(variation)}
            >
              <span>{variation.themeName}</span>
              <small>{variation.layoutName}</small>
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
