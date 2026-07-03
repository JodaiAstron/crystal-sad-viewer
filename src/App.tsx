import { useMemo, useState } from "react";
import type { BravaisLattice } from "./crystal/bravais";
import { applySystemConstraints, buildLattice, type LatticeParams } from "./crystal/lattice";
import { formatZoneAxis, generateZoneAxes, normalizeZoneAxis, type ZoneAxis } from "./crystal/zoneAxis";
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

interface OrientationResult {
  axis: ZoneAxis;
  pattern: ReturnType<typeof computeSaedPattern>;
  poles: ReturnType<typeof computePolePoints>;
  kikuchiLines: ReturnType<typeof computeKikuchiLines>;
}

export default function App() {
  const [params, setParams] = useState<LatticeParams>(defaultParams);
  const [bravais, setBravais] = useState<BravaisLattice>("P");
  const [settings, setSettings] = useState<DisplaySettings>(defaultSettings);
  const [customAxisInput, setCustomAxisInput] = useState<ZoneAxis>({ u: 1, v: 2, w: 3 });

  const model = useMemo(() => {
    try {
      const constrainedParams = applySystemConstraints(params);
      const lattice = buildLattice(constrainedParams);
      const makeOrientation = (axis: ZoneAxis): OrientationResult => {
        const basis = buildProjectionBasis(lattice, axis);
        return {
          axis,
          pattern: computeSaedPattern(lattice, axis, bravais, settings.maxReflectionIndex),
          poles: computePolePoints(lattice, basis, bravais, settings.maxReflectionIndex),
          kikuchiLines: computeKikuchiLines(lattice, basis, bravais, settings.maxKikuchiIndex)
        };
      };
      const axes = generateZoneAxes(constrainedParams.system, settings.maxZoneAxisIndex);
      const orientations = axes.map(makeOrientation);
      const customAxis = normalizeZoneAxis(customAxisInput);
      const customOrientation = customAxis ? makeOrientation(customAxis) : null;
      return { error: null as string | null, constrainedParams, orientations, customAxis, customOrientation };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Could not build this lattice.",
        constrainedParams: params,
        orientations: [],
        customAxis: null,
        customOrientation: null
      };
    }
  }, [params, bravais, settings.maxZoneAxisIndex, settings.maxReflectionIndex, settings.maxKikuchiIndex, customAxisInput]);

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
        <>
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

          <section className="custom-axis-section" aria-label="Custom zone axis">
            <div className="custom-axis-header">
              <div>
                <h2>Custom zone axis</h2>
                <p>{model.customAxis ? `Displayed as ${formatZoneAxis(model.customAxis)}` : "[000] is not a valid zone axis."}</p>
              </div>
              <div className="custom-axis-inputs">
                {(["u", "v", "w"] as const).map((key) => (
                  <label key={key}>
                    <span>{key}</span>
                    <input
                      type="number"
                      step={1}
                      value={customAxisInput[key]}
                      onChange={(event) =>
                        setCustomAxisInput({
                          ...customAxisInput,
                          [key]: Math.trunc(Number(event.target.value) || 0)
                        })
                      }
                    />
                  </label>
                ))}
              </div>
            </div>

            {model.customOrientation && (
              <OrientationCard
                axis={model.customOrientation.axis}
                pattern={model.customOrientation.pattern}
                poles={model.customOrientation.poles}
                kikuchiLines={model.customOrientation.kikuchiLines}
                settings={settings}
              />
            )}
          </section>
        </>
      )}
    </main>
  );
}
