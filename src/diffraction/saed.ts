import { isAllowedByBravais, type BravaisLattice } from "../crystal/bravais";
import { directionVector, reciprocalVector, type Lattice } from "../crystal/lattice";
import type { ZoneAxis } from "../crystal/zoneAxis";
import { dot, makePerpendicularBasis, norm, type Vec3 } from "../math/vector";

export interface Hkl {
  h: number;
  k: number;
  l: number;
}

export interface SaedSpot {
  hkl: Hkl;
  x: number;
  y: number;
  radius: number;
}

export interface SaedPattern {
  zoneAxis: ZoneAxis;
  spots: SaedSpot[];
  maxRadius: number;
}

export interface RepresentativeSpotMetric {
  hkl: Hkl;
  label: string;
  distance: number;
  distanceRatio: number;
  angleFromReferenceDegrees: number;
}

export interface SpotPairAngle {
  a: Hkl;
  b: Hkl;
  label: string;
  angleDegrees: number;
}

export interface SaedSpotMetrics {
  reference: RepresentativeSpotMetric | null;
  spots: RepresentativeSpotMetric[];
  pairAngles: SpotPairAngle[];
}

export const formatHkl = ({ h, k, l }: Hkl): string => `(${h} ${k} ${l})`;

export const hklKey = ({ h, k, l }: Hkl): string => `${h},${k},${l}`;

export const isZeroHkl = ({ h, k, l }: Hkl): boolean => h === 0 && k === 0 && l === 0;

export const isInZone = ({ h, k, l }: Hkl, { u, v, w }: ZoneAxis): boolean => h * u + k * v + l * w === 0;

export const generateReflections = (
  maxIndex: number,
  bravais: BravaisLattice,
  zoneAxis?: ZoneAxis
): Hkl[] => {
  const reflections: Hkl[] = [];
  for (let h = -maxIndex; h <= maxIndex; h += 1) {
    for (let k = -maxIndex; k <= maxIndex; k += 1) {
      for (let l = -maxIndex; l <= maxIndex; l += 1) {
        const hkl = { h, k, l };
        if (isZeroHkl(hkl)) {
          continue;
        }
        if (zoneAxis && !isInZone(hkl, zoneAxis)) {
          continue;
        }
        if (!isAllowedByBravais(bravais, h, k, l)) {
          continue;
        }
        reflections.push(hkl);
      }
    }
  }
  return reflections;
};

const hklPriority = ({ h, k, l }: Hkl): number => Math.abs(h) + Math.abs(k) + Math.abs(l);

const hklSortLabel = ({ h, k, l }: Hkl): string =>
  [h, k, l].map((value) => `${value < 0 ? "n" : "p"}${Math.abs(value).toString().padStart(2, "0")}`).join("-");

const canonicalFriedelPositionKey = (spot: SaedSpot): string => {
  let x = spot.x;
  let y = spot.y;
  if (y < -1e-8 || (Math.abs(y) <= 1e-8 && x < 0)) {
    x = -x;
    y = -y;
  }
  return `${x.toFixed(6)},${y.toFixed(6)}`;
};

const foldedAngleDegrees = (a: SaedSpot, b: SaedSpot): number => {
  const cosine = Math.max(-1, Math.min(1, (a.x * b.x + a.y * b.y) / (a.radius * b.radius)));
  const angle = (Math.acos(cosine) * 180) / Math.PI;
  return angle > 90 ? 180 - angle : angle;
};

export const computeSaedPattern = (
  lattice: Lattice,
  zoneAxis: ZoneAxis,
  bravais: BravaisLattice,
  maxReflectionIndex: number
): SaedPattern => {
  const beamVector = directionVector(lattice, zoneAxis.u, zoneAxis.v, zoneAxis.w);
  const { e1, e2 } = makePerpendicularBasis(beamVector);
  const spotsByPosition = new Map<string, SaedSpot>();

  for (const hkl of generateReflections(maxReflectionIndex, bravais, zoneAxis)) {
    const g: Vec3 = reciprocalVector(lattice, hkl.h, hkl.k, hkl.l);
    const x = dot(g, e1);
    const y = dot(g, e2);
    const radius = Math.sqrt(x * x + y * y);
    if (radius < 1e-10 || norm(g) < 1e-10) {
      continue;
    }
    const positionKey = `${x.toFixed(6)},${y.toFixed(6)}`;
    const candidate = { hkl, x, y, radius };
    const current = spotsByPosition.get(positionKey);
    if (!current || hklPriority(candidate.hkl) < hklPriority(current.hkl)) {
      spotsByPosition.set(positionKey, candidate);
    }
  }

  const spots = [...spotsByPosition.values()].sort((a, b) => a.radius - b.radius);
  const maxRadius = Math.max(1, ...spots.map((spot) => spot.radius));
  return { zoneAxis, spots, maxRadius };
};

export const computeRepresentativeSpotMetrics = (
  pattern: SaedPattern,
  maxRepresentativeSpots = 6,
  maxPairAngles = 8
): SaedSpotMetrics => {
  const uniqueByFriedel = new Map<string, SaedSpot>();
  for (const spot of pattern.spots) {
    const key = canonicalFriedelPositionKey(spot);
    const current = uniqueByFriedel.get(key);
    if (
      !current ||
      hklPriority(spot.hkl) < hklPriority(current.hkl) ||
      (hklPriority(spot.hkl) === hklPriority(current.hkl) && hklSortLabel(spot.hkl) < hklSortLabel(current.hkl))
    ) {
      uniqueByFriedel.set(key, spot);
    }
  }

  const representatives = [...uniqueByFriedel.values()]
    .filter((spot) => spot.radius > 1e-10)
    .sort((a, b) => {
      const byRadius = a.radius - b.radius;
      if (Math.abs(byRadius) > 1e-8) {
        return byRadius;
      }
      const byPriority = hklPriority(a.hkl) - hklPriority(b.hkl);
      if (byPriority !== 0) {
        return byPriority;
      }
      return hklSortLabel(a.hkl).localeCompare(hklSortLabel(b.hkl));
    })
    .slice(0, maxRepresentativeSpots);

  const referenceSpot = representatives[0];
  if (!referenceSpot) {
    return { reference: null, spots: [], pairAngles: [] };
  }

  const spots = representatives.map((spot) => ({
    hkl: spot.hkl,
    label: formatHkl(spot.hkl),
    distance: spot.radius,
    distanceRatio: spot.radius / referenceSpot.radius,
    angleFromReferenceDegrees: foldedAngleDegrees(referenceSpot, spot)
  }));

  const pairAngles: SpotPairAngle[] = [];
  for (let i = 0; i < representatives.length; i += 1) {
    for (let j = i + 1; j < representatives.length; j += 1) {
      const a = representatives[i];
      const b = representatives[j];
      pairAngles.push({
        a: a.hkl,
        b: b.hkl,
        label: `${formatHkl(a.hkl)} / ${formatHkl(b.hkl)}`,
        angleDegrees: foldedAngleDegrees(a, b)
      });
    }
  }

  return {
    reference: spots[0],
    spots,
    pairAngles: pairAngles
      .sort((a, b) => {
        const byAngle = a.angleDegrees - b.angleDegrees;
        if (Math.abs(byAngle) > 1e-8) {
          return byAngle;
        }
        return a.label.localeCompare(b.label);
      })
      .slice(0, maxPairAngles)
  };
};
