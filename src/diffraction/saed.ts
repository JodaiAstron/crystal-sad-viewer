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
