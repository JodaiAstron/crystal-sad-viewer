export type Vec3 = [number, number, number];

export const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const scale = (v: Vec3, s: number): Vec3 => [v[0] * s, v[1] * s, v[2] * s];
export const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

export const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0]
];

export const norm = (v: Vec3): number => Math.sqrt(dot(v, v));

export const normalize = (v: Vec3): Vec3 => {
  const length = norm(v);
  if (length < 1e-12) {
    return [0, 0, 0];
  }
  return scale(v, 1 / length);
};

export const absGcd = (a: number, b: number): number => {
  let x = Math.abs(Math.trunc(a));
  let y = Math.abs(Math.trunc(b));
  while (y !== 0) {
    const next = x % y;
    x = y;
    y = next;
  }
  return x;
};

export const gcd3 = (a: number, b: number, c: number): number => {
  const value = absGcd(absGcd(a, b), c);
  return value === 0 ? 1 : value;
};

export const makePerpendicularBasis = (zInput: Vec3): { e1: Vec3; e2: Vec3; z: Vec3 } => {
  const z = normalize(zInput);
  const ref: Vec3 = Math.abs(dot(z, [0, 0, 1])) > 0.9 ? [0, 1, 0] : [0, 0, 1];
  const e1 = normalize(cross(ref, z));
  const e2 = normalize(cross(z, e1));
  return { e1, e2, z };
};

export const vectorKey = (v: Vec3, precision = 6): string =>
  v.map((item) => item.toFixed(precision)).join(",");
