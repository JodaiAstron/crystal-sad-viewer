export type BravaisLattice = "P" | "I" | "F" | "A" | "B" | "C";

export const isAllowedByBravais = (
  bravais: BravaisLattice,
  h: number,
  k: number,
  l: number
): boolean => {
  switch (bravais) {
    case "P":
      return true;
    case "I":
      return (h + k + l) % 2 === 0;
    case "F":
      return Math.abs(h % 2) === Math.abs(k % 2) && Math.abs(k % 2) === Math.abs(l % 2);
    case "A":
      return (k + l) % 2 === 0;
    case "B":
      return (h + l) % 2 === 0;
    case "C":
      return (h + k) % 2 === 0;
  }
};
