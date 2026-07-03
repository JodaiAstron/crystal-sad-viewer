# Crystal SAD / Stereonet / Kikuchi Viewer

Static React + Vite + TypeScript app for inspecting geometric electron diffraction relationships from lattice parameters.

## Purpose

The app shows, for generated zone axes `[uvw]`:

- SAD spot positions with `(hkl)` labels
- stereonet pole figures
- geometric Kikuchi center lines satisfying `k . g_hkl = 0`

It is intended for relative geometry: spot positions, angles, and distances.

## Implemented

- Crystal systems: cubic, tetragonal, orthorhombic, hexagonal, monoclinic, triclinic
- Lattice parameter simplification by crystal system
- Direct-lattice direction vectors for `[uvw]`
- Reciprocal-lattice plane normals for `(hkl)`
- ZOLZ filtering with `h u + k v + l w = 0`
- Basic Bravais extinction rules for `P`, `I`, `F`, `A`, `B`, and `C`
- SVG SAD and stereonet rendering
- Browser-only calculations

## Not Implemented

- CIF loading
- structure factors
- intensity calculation
- dynamical diffraction
- Kikuchi band width, excess/defect contrast, or intensity
- hexagonal four-index notation

## Local Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Run the unit checks:

```bash
npm test
```

## GitHub Pages

This repository includes a GitHub Actions workflow at `.github/workflows/deploy-pages.yml`.

For this project repository, Vite uses:

```ts
base: "/crystal-sad-viewer/"
```

To publish:

1. Push changes to `main`.
2. In GitHub, open repository Settings, then Pages.
3. Set Build and deployment source to GitHub Actions if it is not already selected.
4. Wait for the "Deploy GitHub Pages" workflow to complete.

The expected project page URL is:

```text
https://jodaiastron.github.io/crystal-sad-viewer/
```

## Crystallographic Checks

- `cubic P, a=1, [001]`: SAD reflections should have `l = 0`.
- `cubic P, a=1, [110]`: SAD reflections should have `h + k = 0`.
- `cubic P, a=1, [111]`: SAD reflections should have `h + k + l = 0`.
- `tetragonal P, a=1, c=2, [100]`: `(010)` and `(001)` distances should differ because `c != a`.
