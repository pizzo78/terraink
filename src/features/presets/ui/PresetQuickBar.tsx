import { usePosterPresets } from "@/features/presets/application/usePosterPresets";

export default function PresetQuickBar() {
  const { presets, applyPreset } = usePosterPresets();

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
    </section>
  );
}
