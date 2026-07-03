import { isAllowedByBravais, type BravaisLattice } from "../crystal/bravais";
import { reciprocalVector, type Lattice } from "../crystal/lattice";
import { cross, gcd3, makePerpendicularBasis, normalize, type Vec3 } from "../math/vector";
import { formatHkl, type Hkl } from "./saed";
import { projectToStereonet, type ProjectionBasis } from "./stereonet";

export interface KikuchiSegment {
  points: Array<{ x: number; y: number }>;
}

export interface KikuchiLine {
  hkl: Hkl;
  label: string;
  segments: KikuchiSegment[];
}

const normalizePlane = ({ h, k, l }: Hkl): Hkl | null => {
  if (h === 0 && k === 0 && l === 0) {
    return null;
  }
  const divisor = gcd3(h, k, l);
  let plane = { h: h / divisor, k: k / divisor, l: l / divisor };
  const firstNonZero = [plane.h, plane.k, plane.l].find((value) => value !== 0) ?? 1;
  if (firstNonZero < 0) {
    plane = { h: -plane.h, k: -plane.k, l: -plane.l };
  }
  return plane;
};

export const computeKikuchiGreatCircle = (
  lattice: Lattice,
  basis: ProjectionBasis,
  hkl: Hkl,
  sampleCount = 240
): KikuchiSegment[] => {
  const g = normalize(reciprocalVector(lattice, hkl.h, hkl.k, hkl.l));
  const { e1 } = makePerpendicularBasis(g);
  const e2 = normalize(cross(g, e1));
  const segments: KikuchiSegment[] = [];
  let current: KikuchiSegment = { points: [] };

  for (let i = 0; i <= sampleCount; i += 1) {
    const t = (2 * Math.PI * i) / sampleCount;
    const point: Vec3 = [
      Math.cos(t) * e1[0] + Math.sin(t) * e2[0],
      Math.cos(t) * e1[1] + Math.sin(t) * e2[1],
      Math.cos(t) * e1[2] + Math.sin(t) * e2[2]
    ];
    const projected = projectToStereonet(basis, point);
    if (projected && Math.sqrt(projected.x * projected.x + projected.y * projected.y) <= 1.001) {
      current.points.push({ x: projected.x, y: projected.y });
    } else if (current.points.length > 1) {
      segments.push(current);
      current = { points: [] };
    } else {
      current = { points: [] };
    }
  }

  if (current.points.length > 1) {
    segments.push(current);
  }
  return segments;
};

export const computeKikuchiLines = (
  lattice: Lattice,
  basis: ProjectionBasis,
  bravais: BravaisLattice,
  maxKikuchiIndex: number
): KikuchiLine[] => {
  const planes = new Map<string, Hkl>();
  for (let h = -maxKikuchiIndex; h <= maxKikuchiIndex; h += 1) {
    for (let k = -maxKikuchiIndex; k <= maxKikuchiIndex; k += 1) {
      for (let l = -maxKikuchiIndex; l <= maxKikuchiIndex; l += 1) {
        const normalized = normalizePlane({ h, k, l });
        if (!normalized) {
          continue;
        }
        if (!isAllowedByBravais(bravais, normalized.h, normalized.k, normalized.l)) {
          continue;
        }
        planes.set(`${normalized.h},${normalized.k},${normalized.l}`, normalized);
      }
    }
  }

  return [...planes.values()]
    .sort((a, b) => Math.abs(a.h) + Math.abs(a.k) + Math.abs(a.l) - (Math.abs(b.h) + Math.abs(b.k) + Math.abs(b.l)))
    .map((hkl) => ({
      hkl,
      label: formatHkl(hkl),
      segments: computeKikuchiGreatCircle(lattice, basis, hkl)
    }))
    .filter((line) => line.segments.length > 0);
};
