import { formatHkl, type SaedPattern } from "../diffraction/saed";

interface SaedSvgProps {
  pattern: SaedPattern;
  showLabels: boolean;
}

export default function SaedSvg({ pattern, showLabels }: SaedSvgProps) {
  const scale = 84 / Math.max(pattern.maxRadius, 1e-9);
  return (
    <svg className="plot-svg" viewBox="-110 -110 220 220" role="img" aria-label="SAD pattern">
      <rect x="-110" y="-110" width="220" height="220" className="plot-bg" />
      <line x1="-96" y1="0" x2="96" y2="0" className="axis-line" />
      <line x1="0" y1="-96" x2="0" y2="96" className="axis-line" />
      <circle cx="0" cy="0" r="3.6" className="direct-spot" />
      {pattern.spots.map((spot) => {
        const x = spot.x * scale;
        const y = -spot.y * scale;
        return (
          <g key={`${spot.hkl.h},${spot.hkl.k},${spot.hkl.l}`}>
            <circle cx={x} cy={y} r="2.8" className="sad-spot" />
            {showLabels && (
              <text x={x + 3.8} y={y - 3.8} className="spot-label">
                {formatHkl(spot.hkl)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
