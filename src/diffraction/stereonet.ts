import { isAllowedByBravais, type BravaisLattice } from "../crystal/bravais";
import { directionVector, reciprocalVector, type Lattice } from "../crystal/lattice";
import type { ZoneAxis } from "../crystal/zoneAxis";
import { dot, makePerpendicularBasis, normalize, scale, type Vec3 } from "../math/vector";
import { formatHkl, type Hkl } from "./saed";

export interface ProjectionBasis {
  sx: Vec3;
  sy: Vec3;
  sz: Vec3;
}

export interface ProjectedPoint {
  x: number;
  y: number;
  z: number;
}

export interface PolePoint extends ProjectedPoint {
  hkl: Hkl;
  label: string;
  showLabel: boolean;
}

export const buildProjectionBasis = (lattice: Lattice, zoneAxis: ZoneAxis): ProjectionBasis => {
  const center = directionVector(lattice, zoneAxis.u, zoneAxis.v, zoneAxis.w);
  const { e1, e2, z } = makePerpendicularBasis(center);
  return { sx: e1, sy: e2, sz: z };
};

export const projectToStereonet = (basis: ProjectionBasis, vector: Vec3): ProjectedPoint | null => {
  const p = normalize(vector);
  const x = dot(p, basis.sx);
  const y = dot(p, basis.sy);
  const z = dot(p, basis.sz);
  if (z < -1e-8) {
    return null;
  }
  const denominator = 1 + z;
  if (denominator < 1e-8) {
    return null;
  }
  return { x: x / denominator, y: y / denominator, z };
};

const canonicalPlaneKey = ({ h, k, l }: Hkl): string => {
  const values = [h, k, l];
  const firstNonZero = values.find((value) => value !== 0) ?? 1;
  const sign = firstNonZero < 0 ? -1 : 1;
  return `${h * sign},${k * sign},${l * sign}`;
};

export const computePolePoints = (
  lattice: Lattice,
  basis: ProjectionBasis,
  bravais: BravaisLattice,
  maxReflectionIndex: number
): PolePoint[] => {
  const points: PolePoint[] = [];
  const seen = new Set<string>();
  for (let h = -maxReflectionIndex; h <= maxReflectionIndex; h += 1) {
    for (let k = -maxReflectionIndex; k <= maxReflectionIndex; k += 1) {
      for (let l = -maxReflectionIndex; l <= maxReflectionIndex; l += 1) {
        if (h === 0 && k === 0 && l === 0) {
          continue;
        }
        if (!isAllowedByBravais(bravais, h, k, l)) {
          continue;
        }
        const hkl = { h, k, l };
        const key = canonicalPlaneKey(hkl);
        if (seen.has(key)) {
          continue;
        }
        seen.add(key);
        let pole = normalize(reciprocalVector(lattice, h, k, l));
        if (dot(pole, basis.sz) < 0) {
          pole = scale(pole, -1);
        }
        const projected = projectToStereonet(basis, pole);
        if (!projected) {
          continue;
        }
        const indexSum = Math.abs(h) + Math.abs(k) + Math.abs(l);
        points.push({
          ...projected,
          hkl,
          label: formatHkl(hkl),
          showLabel: indexSum <= 3 && Math.max(Math.abs(h), Math.abs(k), Math.abs(l)) <= 2
        });
      }
    }
  }
  return points.sort((a, b) => Math.abs(a.hkl.h) + Math.abs(a.hkl.k) + Math.abs(a.hkl.l) - (Math.abs(b.hkl.h) + Math.abs(b.hkl.k) + Math.abs(b.hkl.l)));
};
