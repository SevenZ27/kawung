# Method notes

## Coordinate system

A scene is built for an aspect ratio. The short side is 1000 units and the long side follows the ratio. `density` (1-10) sets how many base cells fit across the short side, with a small per-motif mapping in `repeats()`. Line width is `unit x (0.004 + 0.0034 x weight)`.

The pattern is drawn around the centre of the screen and rotated as one group. Cells are skipped when their centre, after rotation, falls outside the visible rectangle plus a margin.

## Randomness

- `mulberry32(seed)` gives the global choices for a motif, for example which inner detail kawung petals get.
- `cellSeed(seed, i, j, salt)` mixes the seed with the grid position. Truntum uses it for the blossom type of each cell, kawung for the scattered gap ornaments.
- All numbers are rounded to two decimals when written to a path, so the same input always gives the same string.

## Motif geometry

**Kawung.** Junctions are points `(i, j) x h` with `i + j` even, where `h` is half a cell. Petals are ellipses centred on every half-integer point, turned +45 or -45 degrees. For two petals that share a junction at 90 degrees, the closest they get follows `A^2 + B^2 = reach^2`, where `reach` is the distance from the junction to the petal centre. The code picks a fatness `B / A` and solves `A` so the sum is 90-96% of `reach^2`.

**Parang.** Drawn flat, then turned 45 degrees. Each band has a strip of diamonds and a row of blades. A blade is the area between two cubic curves that share both end points: `M top C (u0 + curl L, top) (u0 + (1 - curl) L, bottom) end`, and the same curve shifted by `g` on the way back. Blades repeat at a pitch shorter than their length, so they nest like the S shapes in parang.

**Truntum.** Blossoms sit on a diagonal grid (`i + j` even on a half-cell lattice). There are three blossom types: eight petals, an eight-point star, and a ring of dots. The seed decides which type is most common and how often a second type appears.

**Ceplok.** One rosette per square: a frame (circle or diamond), four or eight petals, small leaves between petals, a centre dot. Corners get a star, a four-dot clover or a diamond. Choices are made once for the whole image so every square stays symmetric.

## Export

A blank new visit starts at the native iPhone size. A legacy link without dimensions uses `exportSize(screen, device)` to initialize output from screen size × devicePixelRatio. The URL stores short side `x` and long side `y`; subsequent rendering uses `exportSize(screen, device, params)`, which prioritizes these pinned dimensions. Preview aspect is derived from the same final output size. The preview frame reserves space outside the artwork so its bezel does not change the artwork aspect. The phone mask rounds the screen corners and overlays an island; the exported PNG keeps the full rectangular artwork. Both renderers use the same path strings; antialiasing can differ.

The app caps output at 16,777,216 pixels and 16,384 pixels per side. These are conservative app limits, not a universal statement about Safari. Missing, partial, or invalid URL dimensions fall back to screen initialization. “Gunakan ukuran layar ini” updates pinned dimensions explicitly.

## Clock contrast

`sampleClock()` draws at 240 px wide and samples a rectangle behind the preview date and clock. `chooseClock()` selects the light/dark tone with the smallest fraction of samples below 3:1. Ties choose the larger P10 contrast. The UI reports P10 and weak-area coverage, not a median alone.

P10 is an area-level estimate: about 90% of samples have at least that ratio. It ignores exact glyph placement, shadows and human performance. The old 90 px median algorithm remains a benchmark baseline. See [protocol](EVALUATION.md), raw results and limitations in [stage two](STAGE-TWO.md).

## Dim and new motifs

Dim mixes every palette color toward black or white by interpolating encoded sRGB channels, at -80..80. Geometry is unchanged and the adjusted colors are exported. Six additional procedural generators implement Nitik, Jlamprang, Megamendung, Tambal, Gringsing and Semen. Structural choices and reference access limitations are recorded in [MOTIF-REFERENCES.md](MOTIF-REFERENCES.md). Nitik's weight control changes the size of its square marks. Legacy Tambal uses barycentric positions inside triangular patches; version 3 uses bounded mixed ornaments inside diamond patches. Gringsing places isen inside the exposed part of each overlapping scale.

## Seed collisions and compatibility

Equal settings, aspect, generator version and seed reproduce the same scene. Different seeds do not guarantee different images. Ceplok version 1 has at most 48 combinations of its discrete choices at fixed settings; seeds 0 and 11 collide. Links without a generator version retain that generator. Version 2 adds bounded petal and frame proportions while preserving symmetry. Version 3 refines Nitik, Megamendung and Tambal while preserving the other version-2 generators. Changing motif/seed in the UI selects version 3. Sample SVG/raster hash counts are not a guarantee of perceptual uniqueness across all 100,000 seeds.

## Device screen mapping

The native 3D mode uses a CanvasTexture on the actual screen mesh. The same `buildScene` and `drawScene` functions feed PNG export. Screen UVs are regenerated after asset compression; screen aspect is calibrated to native pixel dimensions. Device lighting does not affect the unlit wallpaper material. Camera rotation changes projection, not composition. Composition shows an orthogonal 2D front bezel: a rounded iPhone frame or a Studio Display frame, with a simple flat monitor stand and no side faces, perspective or cast shadow. Screen width/height follow the exact output ratio; the outer frame includes a proportional bezel. The illustrative date and clock are always shown in Composition, without changing wallpaper or PNG. Resource, resolution and license details are in [DEVICE-ASSETS.md](DEVICE-ASSETS.md).

## Motion and device presets

Frame/device/projection changes use a 140 ms exit and 240 ms entrance; a newer request cancels an unfinished swap. Motif, palette and seed changes crossfade for 320 ms without scaling or blurring the artwork. Slider updates remain direct. The sheet height transitions for 340 ms; 3D rotation buttons ease over 260 ms and dragging interrupts that motion. Reduced motion skips the staged wait and nonessential spatial motion.

Switching HP/Desktop from either native preset selects the corresponding native resolution in Composition as well as 3D. Custom saved dimensions remain pinned until the user chooses another preset. Date, clock, bezels and stand remain preview-only.
