import { describe, expect, it } from "vitest";
import { buildLattice } from "../crystal/lattice";
import { computeSaedPattern, generateReflections } from "./saed";

const cubic = buildLattice({
  system: "cubic",
  a: 1,
  b: 1,
  c: 1,
  alpha: 90,
  beta: 90,
  gamma: 90
});

describe("SAD reflection filtering", () => {
  it("keeps only l = 0 reflections for cubic [001]", () => {
    const reflections = generateReflections(2, "P", { u: 0, v: 0, w: 1 });
    expect(reflections.every((hkl) => hkl.l === 0)).toBe(true);
    expect(reflections).toEqual(expect.arrayContaining([
      { h: 1, k: 0, l: 0 },
      { h: 0, k: 1, l: 0 },
      { h: 1, k: 1, l: 0 }
    ]));
  });

  it("keeps only h + k = 0 reflections for cubic [110]", () => {
    const reflections = generateReflections(2, "P", { u: 1, v: 1, w: 0 });
    expect(reflections.every((hkl) => hkl.h + hkl.k === 0)).toBe(true);
    expect(reflections).toEqual(expect.arrayContaining([
      { h: 1, k: -1, l: 0 },
      { h: 0, k: 0, l: 1 },
      { h: 1, k: -1, l: 1 }
    ]));
  });

  it("produces a rectangular tetragonal scale for [100] when c differs from a", () => {
    const tetragonal = buildLattice({
      system: "tetragonal",
      a: 1,
      b: 1,
      c: 2,
      alpha: 90,
      beta: 90,
      gamma: 90
    });
    const pattern = computeSaedPattern(tetragonal, { u: 1, v: 0, w: 0 }, "P", 1);
    const spot010 = pattern.spots.find((spot) => spot.hkl.h === 0 && spot.hkl.k === 1 && spot.hkl.l === 0);
    const spot001 = pattern.spots.find((spot) => spot.hkl.h === 0 && spot.hkl.k === 0 && spot.hkl.l === 1);
    expect(spot010?.radius).toBeCloseTo(1);
    expect(spot001?.radius).toBeCloseTo(0.5);
  });

  it("applies body-centered extinction", () => {
    const pattern = computeSaedPattern(cubic, { u: 0, v: 0, w: 1 }, "I", 2);
    expect(pattern.spots.every((spot) => (spot.hkl.h + spot.hkl.k + spot.hkl.l) % 2 === 0)).toBe(true);
  });
});
