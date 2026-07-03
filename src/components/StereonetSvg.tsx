import type { KikuchiLine } from "../diffraction/kikuchi";
import type { PolePoint } from "../diffraction/stereonet";

interface StereonetSvgProps {
  poles: PolePoint[];
  kikuchiLines: KikuchiLine[];
  showKikuchiLines: boolean;
  showPolePoints: boolean;
  showPoleLabels: boolean;
}

const toSvgX = (x: number): number => x * 90;
const toSvgY = (y: number): number => -y * 90;

export default function StereonetSvg({
  poles,
  kikuchiLines,
  showKikuchiLines,
  showPolePoints,
  showPoleLabels
}: StereonetSvgProps) {
  return (
    <svg className="plot-svg" viewBox="-110 -110 220 220" role="img" aria-label="Stereonet with poles and Kikuchi center lines">
      <rect x="-110" y="-110" width="220" height="220" className="plot-bg" />
      <circle cx="0" cy="0" r="90" className="net-outline" />
      <line x1="-90" y1="0" x2="90" y2="0" className="axis-line" />
      <line x1="0" y1="-90" x2="0" y2="90" className="axis-line" />
      <circle cx="0" cy="0" r="2.6" className="net-center" />

      {showKikuchiLines &&
        kikuchiLines.map((line) =>
          line.segments.map((segment, index) => (
            <polyline
              key={`${line.label}-${index}`}
              points={segment.points.map((point) => `${toSvgX(point.x).toFixed(2)},${toSvgY(point.y).toFixed(2)}`).join(" ")}
              className="kikuchi-line"
            />
          ))
        )}

      {(showPolePoints || showPoleLabels) &&
        poles.map((pole) => {
          const x = toSvgX(pole.x);
          const y = toSvgY(pole.y);
          return (
            <g key={`${pole.hkl.h},${pole.hkl.k},${pole.hkl.l}`}>
              {showPolePoints && <circle cx={x} cy={y} r="2.4" className="pole-point" />}
              {showPoleLabels && pole.showLabel && (
                <text x={x + 3.6} y={y - 3.6} className="spot-label">
                  {pole.label}
                </text>
              )}
            </g>
          );
        })}
    </svg>
  );
}
