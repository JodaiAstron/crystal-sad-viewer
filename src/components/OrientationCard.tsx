import { formatZoneAxis, type ZoneAxis } from "../crystal/zoneAxis";
import type { KikuchiLine } from "../diffraction/kikuchi";
import { computeRepresentativeSpotMetrics, type SaedPattern } from "../diffraction/saed";
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
  const spotMetrics = computeRepresentativeSpotMetrics(pattern);

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
            showPolePoints={settings.showPolePoints}
            showPoleLabels={settings.showPoleLabels}
          />
        </figure>
      </div>
      <section className="spot-metrics" aria-label="Representative SAD spot metrics">
        <div className="metrics-title-row">
          <h3>Representative SAD spot ratios</h3>
          {spotMetrics.reference && <span>Reference: {spotMetrics.reference.label}</span>}
        </div>
        {spotMetrics.spots.length === 0 ? (
          <p className="empty-note">No representative spots for this orientation.</p>
        ) : (
          <div className="metrics-grid">
            <table>
              <thead>
                <tr>
                  <th>Spot</th>
                  <th>Distance</th>
                  <th>Ratio</th>
                  <th>Angle from ref</th>
                </tr>
              </thead>
              <tbody>
                {spotMetrics.spots.map((spot) => (
                  <tr key={`${spot.hkl.h},${spot.hkl.k},${spot.hkl.l}`}>
                    <td>{spot.label}</td>
                    <td>{spot.distance.toFixed(4)}</td>
                    <td>{spot.distanceRatio.toFixed(3)}</td>
                    <td>{spot.angleFromReferenceDegrees.toFixed(1)} deg</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="angle-list">
              {spotMetrics.pairAngles.map((pair) => (
                <span key={pair.label}>
                  {pair.label}: {pair.angleDegrees.toFixed(1)} deg
                </span>
              ))}
            </div>
          </div>
        )}
      </section>
    </article>
  );
}
