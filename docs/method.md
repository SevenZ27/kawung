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

`exportSize(screen, device)` sorts the screen sides, multiplies by `devicePixelRatio`, rounds, and scales down when the area passes 16,777,216 pixels or a side passes 16,384. The canvas renderer uses the same path strings through `Path2D`.

## Clock contrast

`readClock()` draws the wallpaper at 90 px wide, reads the pixels in the box behind the date and clock, converts them to WCAG relative luminance, and computes the median contrast against a light and a dark text colour. The higher one wins.
