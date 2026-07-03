import { formatZoneAxis, type ZoneAxis } from "../crystal/zoneAxis";
import type { KikuchiLine } from "../diffraction/kikuchi";
import type { SaedPattern } from "../diffraction/saed";
import type { PolePoint } from "../diffraction/stereonet";
import type { DisplaySettings } from "./CrystalInput";
import SaedSvg from "./SaedSvg";
import StereonetSvg from "./StereonetSvg";

interface OrientationCardProps {
  axis: ZoneAxis;
  pattern: SaedPattern;
  poles: PolePoint[];
  kikuchiLines: KikuchiLine[];
  settings: DisplaySettings;
}

export default function OrientationCard({ axis, pattern, poles, kikuchiLines, settings }: OrientationCardProps) {
  return (
    <article className="orientation-card">
      <header className="orientation-header">
        <h2>{formatZoneAxis(axis)}</h2>
        <div className="metric-row" aria-label="Counts">
          <span>{pattern.spots.length} SAD spots</span>
          <span>{poles.length} poles</span>
          <span>{kikuchiLines.length} Kikuchi lines</span>
        </div>
      </header>
      <div className="plot-grid">
        <figure>
          <figcaption>SAD pattern</figcaption>
          <SaedSvg pattern={pattern} showLabels={settings.showSadLabels} />
        </figure>
        <figure>
          <figcaption>Stereonet</figcaption>
          <StereonetSvg
            poles={poles}
            kikuchiLines={kikuchiLines}
            showKikuchiLines={settings.showKikuchiLines}
            showPoleLabels={settings.showPoleLabels}
          />
        </figure>
      </div>
    </article>
  );
}
