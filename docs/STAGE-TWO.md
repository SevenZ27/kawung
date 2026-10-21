# Kawung — stage two

Local implementation and verification, 21 October 2026. No deployment or Git push was performed. This report complements the historical [stage-one report](STAGE-ONE.md).

## What changed

The editor now contains ten motifs, adding Nitik, Jlamprang, Megamendung, Tambal, Gringsing and Semen. Research records identify the structural features used and where source access or cultural validation remains incomplete. Ceplok version 2 expands bounded shape variation while old links preserve version 1. Nitik's weight slider affects square-mark size; Gringsing's fill details remain visible above the overlapping row; Tambal ornaments stay within their triangular fields.

Dim changes the entire palette from -80 to +80 and is preserved in shared links and PNG export. The clock estimator now prioritizes less area below 3:1, resolves ties by P10, and reports P10 plus weak-area coverage. The UI no longer presents a high median as sufficient evidence of readability.

The downloaded Studio Display and iPhone 18 Pro Max Burgundy meshes are integrated locally. Wallpaper is a native-resolution texture on each screen mesh and moves with the device during pointer/touch rotation. UVs are reconstructed after compression; native screen proportion is calibrated; wallpaper material is unaffected by device lighting. Native resolutions are 5120 × 2880 and 1320 × 2868. Front reset and rotation buttons supplement dragging. Old custom-size links remain intact in composition view until the user explicitly chooses native 3D mode.

The panel provides a compact handle on short phones, leaving more room for the preview. Ten motifs remain available in the expanded sheet. The viewer falls back to composition when its code/model cannot load or WebGL is lost. The screen and PNG remain usable independently. Source/GitHub links are removed from the product UI, with provenance retained in repository documentation.

## Algorithm evaluation

The [protocol](EVALUATION.md) fixes the configurations, baseline and limits. [Raw results](verification/stage-two/results.json), [CSV](verification/stage-two/readability.csv) and [run manifest](verification/stage-two/manifest.json) are retained. The later final verification manifest records the UI changes after this numerical run; algorithm source hashes are checked for consistency.

### Variation: 500 seeds per motif

| Motif | Unique SVG hashes | Unique quantized 64 × 64 raster hashes |
|---|---:|---:|
| Kawung | 500 | 500 |
| Parang | 500 | 500 |
| Truntum | 500 | 500 |
| Ceplok v2 | 500 | 500 |
| Nitik | 500 | 490 |
| Jlamprang | 500 | 499 |
| Megamendung | 498 | 488 |
| Tambal | 500 | 500 |
| Gringsing | 500 | 500 |
| Semen | 500 | 500 |

These are counts within 5,000 fixed seed renders. They do not prove all seeds produce different designs or that people can distinguish every pair. Megamendung's exact repeats and the coarser raster collisions are reported rather than hidden. The legacy Ceplok collision between seeds 0 and 11 is preserved and tested.

### Clock-area comparison: 720 configurations

| Measure | Result |
|---|---:|
| Mean area below 3:1, old 90 px median selector | 3.9554% |
| Mean area below 3:1, new 240 px selector | 2.8064% |
| Absolute mean reduction | 1.1491 percentage points |
| Improved / regressed / unchanged cases | 63 / 1 / 656 |
| Mean absolute P10 error against 720 px reference | 0.5366 ratio units |

One case regressed: Jlamprang/Sogan/desktop, Dim 0, seed 137, density 1, weight 10, rotation 0. Weak-area coverage rises from 25.3493% to 28.3000%, although its P10 increases from 1.2209 to 1.7521. This exposes the sampling/selection tradeoff; the result is not described as universally better.

All 240 cases at Dim -60 and all 240 at +60 have sampled reference-region contrast at least 4.5:1. At Dim 0, average weak-area coverage is 8.4191%. Extreme Dim reduces the original palette's appearance, and passing this synthetic region check is not proof of human readability or WCAG compliance. No population confidence interval or user-study result is claimed.

Scene-plus-SVG construction measured median 0.9–2.9 ms and P95 1.2–3.5 ms across the ten motifs in this run, after warm-up, at the protocol's dense settings. These are local desktop Chrome timings, excluding GPU/device rendering, texture upload and PNG export. They are not mobile interaction benchmarks.

## Verification

- 69 unit tests pass, covering ten-motif determinism, finite geometry, size bounds, meaningful weight controls, URL compatibility, Dim and contrast selection.
- 38 Playwright E2E tests pass: all ten motifs in both PNG orientations, native screen textures versus PNG, pointer rotation/front reset, Dim, native presets, shared dimensions, clipboard outcomes, focus containment and recovery from model/code download failures.
- Sixteen 3D cases pass in Chrome and WebKit: both models at 320 × 568 (DPR 2), 390 × 844 (DPR 3), 812 × 375 (DPR 2), and 1440 × 900 (DPR 1). No page errors, document overflow or axe violations were reported in that pass. All cases retain native texture dimensions. Real touch events were dispatched in Chrome's mobile emulation.
- Screenshots at 2560 × 1440 and DPR 2 inspect fine Nitik marks from the front and at an angle. Antialiasing/minification remains normal raster behavior; this is not a promise of identical quality on every GPU or at unlimited magnification.
- Build/typecheck pass. The lazy 3D chunk is approximately 646 kB raw / 164 kB gzip; Vite still reports its size warning. It is loaded only when the 3D viewer is requested. Converted models total approximately 1.05 MB.

The first network-isolation test detected an injected Kaspersky script. The repeat explicitly excluded that observed environment host; no application-origin third-party request remained. The antivirus was not disabled. Firefox did not launch in this environment and is not claimed as tested. No physical iOS/Android device or human readability study was used.

Evidence: [device browser results](verification/device-browser.json), [asset hashes](verification/device-models.json), [final test log](verification/stage-two-final/e2e.log), [source manifest](verification/stage-two-final/manifest.json) and [desktop screenshot](screenshots/stage-two-device-chrome-1440-desktop.png). Tests support these specific flows and configurations, not a claim that the app has no defects.

## Portfolio framing

A defensible description is: “Built a deterministic procedural wallpaper editor with ten batik-inspired motif families, synchronized SVG/Canvas/3D rendering, native-resolution PNG export, and a reproducible evaluation of 5,000 seed renders and 720 clock-area configurations.”

Describe the statistical work as algorithm evaluation and contrast sampling. Do not call this a trained batik AI model, claim expert-validated motif authenticity, report user-study impact, or present the third-party device meshes as original modeling work. No CV was changed in this stage.

## Remaining release boundary

Local 3D integration is usable. Public distribution of the current directly retrievable GLBs needs a compatible license/permission or an alternative delivery method. The downloads are excluded from Git and are not MIT. See [DEVICE-ASSETS.md](DEVICE-ASSETS.md). This is a publication boundary, not an uncompleted local rendering feature.
