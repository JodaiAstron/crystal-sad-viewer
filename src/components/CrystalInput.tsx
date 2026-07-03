import type { BravaisLattice } from "../crystal/bravais";
import type { CrystalSystem, LatticeParams } from "../crystal/lattice";

export interface DisplaySettings {
  maxZoneAxisIndex: number;
  maxReflectionIndex: number;
  maxKikuchiIndex: number;
  showKikuchiLines: boolean;
  showPolePoints: boolean;
  showPoleLabels: boolean;
  showSadLabels: boolean;
}

export interface Preset {
  label: string;
  params: LatticeParams;
  bravais: BravaisLattice;
}

interface CrystalInputProps {
  params: LatticeParams;
  bravais: BravaisLattice;
  settings: DisplaySettings;
  presets: Preset[];
  onParamsChange: (params: LatticeParams) => void;
  onBravaisChange: (bravais: BravaisLattice) => void;
  onSettingsChange: (settings: DisplaySettings) => void;
  onPreset: (preset: Preset) => void;
}

const systems: CrystalSystem[] = ["cubic", "tetragonal", "orthorhombic", "hexagonal", "monoclinic", "triclinic"];
const bravaisOptions: BravaisLattice[] = ["P", "I", "F", "A", "B", "C"];

const visibleFields: Record<CrystalSystem, Array<keyof LatticeParams>> = {
  cubic: ["a"],
  tetragonal: ["a", "c"],
  orthorhombic: ["a", "b", "c"],
  hexagonal: ["a", "c"],
  monoclinic: ["a", "b", "c", "beta"],
  triclinic: ["a", "b", "c", "alpha", "beta", "gamma"]
};

export default function CrystalInput({
  params,
  bravais,
  settings,
  presets,
  onParamsChange,
  onBravaisChange,
  onSettingsChange,
  onPreset
}: CrystalInputProps) {
  const fields = visibleFields[params.system];

  const updateNumber = (key: keyof LatticeParams, value: string) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return;
    }
    onParamsChange({ ...params, [key]: numeric });
  };

  return (
    <section className="control-panel" aria-label="Crystal controls">
      <div className="control-grid">
        <label>
          <span>Crystal system</span>
          <select
            value={params.system}
            onChange={(event) => onParamsChange({ ...params, system: event.target.value as CrystalSystem })}
          >
            {systems.map((system) => (
              <option key={system} value={system}>
                {system}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Bravais lattice</span>
          <select value={bravais} onChange={(event) => onBravaisChange(event.target.value as BravaisLattice)}>
            {bravaisOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        {fields.map((field) => (
          <label key={field}>
            <span>{field}</span>
            <input
              type="number"
              min={field === "alpha" || field === "beta" || field === "gamma" ? 1 : 0.01}
              step={field === "alpha" || field === "beta" || field === "gamma" ? 0.5 : 0.01}
              value={String(params[field])}
              onChange={(event) => updateNumber(field, event.target.value)}
            />
          </label>
        ))}

        <label>
          <span>Max zone axis index</span>
          <input
            type="number"
            min={1}
            max={4}
            step={1}
            value={settings.maxZoneAxisIndex}
            onChange={(event) =>
              onSettingsChange({ ...settings, maxZoneAxisIndex: Math.max(1, Math.trunc(Number(event.target.value))) })
            }
          />
        </label>

        <label>
          <span>Max reflection index</span>
          <input
            type="number"
            min={1}
            max={8}
            step={1}
            value={settings.maxReflectionIndex}
            onChange={(event) =>
              onSettingsChange({ ...settings, maxReflectionIndex: Math.max(1, Math.trunc(Number(event.target.value))) })
            }
          />
        </label>

        <label>
          <span>Max Kikuchi hkl index</span>
          <input
            type="number"
            min={1}
            max={4}
            step={1}
            value={settings.maxKikuchiIndex}
            onChange={(event) =>
              onSettingsChange({ ...settings, maxKikuchiIndex: Math.max(1, Math.trunc(Number(event.target.value))) })
            }
          />
        </label>
      </div>

      <div className="toggle-row">
        <label className="check-label">
          <input
            type="checkbox"
            checked={settings.showKikuchiLines}
            onChange={(event) => onSettingsChange({ ...settings, showKikuchiLines: event.target.checked })}
          />
          <span>Kikuchi lines</span>
        </label>
        <label className="check-label">
          <input
            type="checkbox"
            checked={settings.showPolePoints}
            onChange={(event) => onSettingsChange({ ...settings, showPolePoints: event.target.checked })}
          />
          <span>Pole points</span>
        </label>
        <label className="check-label">
          <input
            type="checkbox"
            checked={settings.showPoleLabels}
            onChange={(event) => onSettingsChange({ ...settings, showPoleLabels: event.target.checked })}
          />
          <span>Pole labels</span>
        </label>
        <label className="check-label">
          <input
            type="checkbox"
            checked={settings.showSadLabels}
            onChange={(event) => onSettingsChange({ ...settings, showSadLabels: event.target.checked })}
          />
          <span>SAD labels</span>
        </label>
      </div>

      <div className="preset-row" aria-label="Presets">
        {presets.map((preset) => (
          <button key={preset.label} type="button" onClick={() => onPreset(preset)}>
            {preset.label}
          </button>
        ))}
      </div>
    </section>
  );
}
