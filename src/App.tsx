import { useMemo, useState } from "react";
import type { BravaisLattice } from "./crystal/bravais";
import { applySystemConstraints, buildLattice, type LatticeParams } from "./crystal/lattice";
import { generateZoneAxes } from "./crystal/zoneAxis";
import CrystalInput, { type DisplaySettings, type Preset } from "./components/CrystalInput";
import OrientationCard from "./components/OrientationCard";
import { computeKikuchiLines } from "./diffraction/kikuchi";
import { computeSaedPattern } from "./diffraction/saed";
import { buildProjectionBasis, computePolePoints } from "./diffraction/stereonet";

const defaultParams: LatticeParams = {
  system: "cubic",
  a: 1,
  b: 1,
  c: 1,
  alpha: 90,
  beta: 90,
  gamma: 90
};

const defaultSettings: DisplaySettings = {
  maxZoneAxisIndex: 2,
  maxReflectionIndex: 4,
  maxKikuchiIndex: 2,
  showKikuchiLines: true,
  showPolePoints: false,
  showPoleLabels: true,
  showSadLabels: true
};

const presets: Preset[] = [
  {
    label: "Cubic P a=1",
    bravais: "P",
    params: defaultParams
  },
  {
    label: "SrTiO3-like cubic P a=3.905",
    bravais: "P",
    params: { ...defaultParams, a: 3.905, b: 3.905, c: 3.905 }
  },
  {
    label: "Tetragonal example",
    bravais: "P",
    params: { ...defaultParams, system: "tetragonal", a: 1, b: 1, c: 2 }
  },
  {
    label: "Hexagonal example",
    bravais: "P",
    params: { ...defaultParams, system: "hexagonal", a: 1, b: 1, c: 1.63, gamma: 120 }
  }
];

export default function App() {
  const [params, setParams] = useState<LatticeParams>(defaultParams);
  const [bravais, setBravais] = useState<BravaisLattice>("P");
  const [settings, setSettings] = useState<DisplaySettings>(defaultSettings);

  const model = useMemo(() => {
    try {
      const constrainedParams = applySystemConstraints(params);
      const lattice = buildLattice(constrainedParams);
      const axes = generateZoneAxes(constrainedParams.system, settings.maxZoneAxisIndex);
      const orientations = axes.map((axis) => {
        const basis = buildProjectionBasis(lattice, axis);
        return {
          axis,
          pattern: computeSaedPattern(lattice, axis, bravais, settings.maxReflectionIndex),
          poles: computePolePoints(lattice, basis, bravais, settings.maxReflectionIndex),
          kikuchiLines: computeKikuchiLines(lattice, basis, bravais, settings.maxKikuchiIndex)
        };
      });
      return { error: null as string | null, constrainedParams, orientations };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Could not build this lattice.",
        constrainedParams: params,
        orientations: []
      };
    }
  }, [params, bravais, settings.maxZoneAxisIndex, settings.maxReflectionIndex, settings.maxKikuchiIndex]);

  const onPreset = (preset: Preset) => {
    setParams(preset.params);
    setBravais(preset.bravais);
  };

  return (
    <main>
      <header className="app-header">
        <div>
          <p className="eyebrow">Geometric diffraction preview</p>
          <h1>Crystal SAD / Stereonet / Kikuchi Viewer</h1>
          <p className="lede">
            This app shows geometric SAD spot positions, stereonet pole figures, and Kikuchi center lines.
            Intensities and dynamical diffraction are not calculated.
          </p>
        </div>
      </header>

      <CrystalInput
        params={model.constrainedParams}
        bravais={bravais}
        settings={settings}
        presets={presets}
        onParamsChange={setParams}
        onBravaisChange={setBravais}
        onSettingsChange={setSettings}
        onPreset={onPreset}
      />

      {model.error ? (
        <p className="error-message">{model.error}</p>
      ) : (
        <section className="orientation-list" aria-label="Orientation results">
          {model.orientations.map((orientation) => (
            <OrientationCard
              key={`${orientation.axis.u},${orientation.axis.v},${orientation.axis.w}`}
              axis={orientation.axis}
              pattern={orientation.pattern}
              poles={orientation.poles}
              kikuchiLines={orientation.kikuchiLines}
              settings={settings}
            />
          ))}
        </section>
      )}
    </main>
  );
}
