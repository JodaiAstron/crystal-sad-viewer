import type { CrystalSystem } from "./lattice";
import { gcd3 } from "../math/vector";

export interface ZoneAxis {
  u: number;
  v: number;
  w: number;
}

export const formatZoneAxis = ({ u, v, w }: ZoneAxis): string => `[${u} ${v} ${w}]`;

export const normalizeZoneAxis = ({ u, v, w }: ZoneAxis): ZoneAxis | null => {
  if (u === 0 && v === 0 && w === 0) {
    return null;
  }
  const divisor = gcd3(u, v, w);
  let axis: ZoneAxis = { u: u / divisor, v: v / divisor, w: w / divisor };
  const values = [axis.u, axis.v, axis.w];
  const firstNonZero = values.find((value) => value !== 0) ?? 1;
  if (firstNonZero < 0) {
    axis = { u: -axis.u, v: -axis.v, w: -axis.w };
  }
  return axis;
};

export const primitiveKey = ({ u, v, w }: ZoneAxis): string => `${u},${v},${w}`;

export const equivalentZoneAxisKey = (system: CrystalSystem, axis: ZoneAxis): string => {
  const { u, v, w } = axis;
  if (system === "cubic") {
    return [Math.abs(u), Math.abs(v), Math.abs(w)].sort((a, b) => b - a).join(",");
  }
  if (system === "tetragonal" || system === "hexagonal") {
    // Hexagonal is kept in 3-index notation for this MVP. A future 4-index form needs a new key.
    const planar = [Math.abs(u), Math.abs(v)].sort((a, b) => b - a).join(",");
    return `${planar},${Math.abs(w)}`;
  }
  if (system === "orthorhombic") {
    return `${Math.abs(u)},${Math.abs(v)},${Math.abs(w)}`;
  }
  return primitiveKey(axis);
};

const preferredCubicAxes: ZoneAxis[] = [
  { u: 0, v: 0, w: 1 },
  { u: 1, v: 1, w: 0 },
  { u: 1, v: 1, w: 1 },
  { u: 2, v: 1, w: 0 },
  { u: 2, v: 1, w: 1 },
  { u: 2, v: 2, w: 1 }
];

const axisSortValue = (axis: ZoneAxis): number =>
  Math.abs(axis.u) + Math.abs(axis.v) + Math.abs(axis.w) + Math.max(Math.abs(axis.u), Math.abs(axis.v), Math.abs(axis.w)) / 10;

export const generateZoneAxes = (system: CrystalSystem, maxIndex: number): ZoneAxis[] => {
  const byEquivalentKey = new Map<string, ZoneAxis>();
  for (let u = -maxIndex; u <= maxIndex; u += 1) {
    for (let v = -maxIndex; v <= maxIndex; v += 1) {
      for (let w = -maxIndex; w <= maxIndex; w += 1) {
        const normalized = normalizeZoneAxis({ u, v, w });
        if (!normalized) {
          continue;
        }
        const key = equivalentZoneAxisKey(system, normalized);
        const current = byEquivalentKey.get(key);
        if (!current || axisSortValue(normalized) < axisSortValue(current)) {
          byEquivalentKey.set(key, normalized);
        }
      }
    }
  }

  if (system === "cubic") {
    for (const preferred of preferredCubicAxes) {
      if (Math.max(Math.abs(preferred.u), Math.abs(preferred.v), Math.abs(preferred.w)) <= maxIndex) {
        byEquivalentKey.set(equivalentZoneAxisKey(system, preferred), preferred);
      }
    }
  }

  return [...byEquivalentKey.values()].sort((a, b) => {
    const bySize = axisSortValue(a) - axisSortValue(b);
    if (Math.abs(bySize) > 1e-9) {
      return bySize;
    }
    return primitiveKey(a).localeCompare(primitiveKey(b));
  });
};
