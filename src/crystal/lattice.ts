import { inverse3x3, matrixFromColumns, multiplyMatrixVector, transpose, type Mat3 } from "../math/matrix";
import type { Vec3 } from "../math/vector";

export type CrystalSystem =
  | "cubic"
  | "tetragonal"
  | "orthorhombic"
  | "hexagonal"
  | "monoclinic"
  | "triclinic";

export interface LatticeParams {
  system: CrystalSystem;
  a: number;
  b: number;
  c: number;
  alpha: number;
  beta: number;
  gamma: number;
}

export interface Lattice {
  params: LatticeParams;
  directBasis: Mat3;
  reciprocalBasis: Mat3;
}

const degToRad = (degrees: number): number => (degrees * Math.PI) / 180;

export const applySystemConstraints = (params: LatticeParams): LatticeParams => {
  const { system } = params;
  if (system === "cubic") {
    return { ...params, b: params.a, c: params.a, alpha: 90, beta: 90, gamma: 90 };
  }
  if (system === "tetragonal") {
    return { ...params, b: params.a, alpha: 90, beta: 90, gamma: 90 };
  }
  if (system === "orthorhombic") {
    return { ...params, alpha: 90, beta: 90, gamma: 90 };
  }
  if (system === "hexagonal") {
    return { ...params, b: params.a, alpha: 90, beta: 90, gamma: 120 };
  }
  if (system === "monoclinic") {
    return { ...params, alpha: 90, gamma: 90 };
  }
  return params;
};

export const buildLattice = (input: LatticeParams): Lattice => {
  const params = applySystemConstraints(input);
  const alpha = degToRad(params.alpha);
  const beta = degToRad(params.beta);
  const gamma = degToRad(params.gamma);
  const cosAlpha = Math.cos(alpha);
  const cosBeta = Math.cos(beta);
  const cosGamma = Math.cos(gamma);
  const sinGamma = Math.sin(gamma);

  if (Math.abs(sinGamma) < 1e-12) {
    throw new Error("Gamma angle creates a degenerate lattice.");
  }

  const aVec: Vec3 = [params.a, 0, 0];
  const bVec: Vec3 = [params.b * cosGamma, params.b * sinGamma, 0];
  const cy = (cosAlpha - cosBeta * cosGamma) / sinGamma;
  const czTerm = 1 - cosBeta * cosBeta - cy * cy;
  const cVec: Vec3 = [
    params.c * cosBeta,
    params.c * cy,
    params.c * Math.sqrt(Math.max(0, czTerm))
  ];
  const directBasis = matrixFromColumns(aVec, bVec, cVec);
  const reciprocalBasis = inverse3x3(transpose(directBasis));
  return { params, directBasis, reciprocalBasis };
};

export const directionVector = (lattice: Lattice, u: number, v: number, w: number): Vec3 =>
  multiplyMatrixVector(lattice.directBasis, [u, v, w]);

export const reciprocalVector = (lattice: Lattice, h: number, k: number, l: number): Vec3 =>
  multiplyMatrixVector(lattice.reciprocalBasis, [h, k, l]);
