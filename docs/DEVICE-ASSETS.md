# Device preview assets

Integration, 21 October 2026. Device meshes are third-party work; Steven's implementation covers conversion, material adaptation, dynamic screen mapping, interaction and verification. They are not original CAD work or Apple-certified models.

## Current revision

The downloaded models were restored on 21 October 2026 after the parametric replacements were rejected. Three visually identified Apple-logo meshes were removed; all other mesh attributes, indices and transforms, including `WallpaperScreen`, are byte-identical after decoding. The unmodified optimized inputs are retained under `qa/assets/converted-local-only/`. Run `pnpm models` to regenerate the no-logo local outputs. See [restoration verification](DEVICE-RESTORATION.md) and [geometry checks](verification/device-logo-removal.json). Logo removal does not change ownership or license terms.

## Sources and licensing

| Device | File supplied by Steven | Creator / listing |
|---|---|---|
| Studio Display | `studio_display.usdz`, 3,508,429 bytes | [james20130527 / CGTrader](https://www.cgtrader.com/free-3d-models/electronics/computer/apple-studio-display-bd6083ad-1491-4c11-8ee6-0ce1a65999cf) |
| iPhone 18 Pro Max Burgundy | `iPhone+18+Pro+Max.fbx`, 6,848,448 bytes | [LunaRende / CGTrader](https://www.cgtrader.com/free-3d-models/electronics/phone/iphone-18-pro-max-95a16591-2bbc-437b-8dd0-7ae6da86a251) |

Both listings state Royalty Free License (no AI). Free download does not grant MIT redistribution rights. CGTrader's [license explanation](https://help.cgtrader.com/hc/en-us/articles/360015124437-Royalty-Free-License) and [terms](https://www.cgtrader.com/pages/terms-and-conditions) distinguish incorporated use from standalone redistribution and require protection against retrieval of the asset. These files are used locally with the user's authorization. Raw downloads and converted GLBs are excluded from Git and are not covered by this repository's MIT license.

The release serves the meshes as encrypted application resources rather than standalone GLBs. Source downloads, converted meshes, generated resource files and their build manifest are excluded from public GitHub. These measures limit direct reuse; a browser must decrypt the resource to render it, so a determined user can still extract it. This is not DRM, a guarantee of license compliance, or additional permission from either creator. Logo removal and noncommercial use do not change the license.

## Application resource delivery

`pnpm models` writes the verified no-logo meshes to `qa/assets/no-logo/`. `pnpm models:package` packages each mesh as `KWP1` with AES-256-GCM, a random key and nonce, and an authenticated payload. It checks byte-for-byte round trips and rejection of modified ciphertext. See [packaging checks](verification/device-packaging.json).

The Vite plugin incorporates only the active resource files into the build. The browser decrypts them in memory and passes the bytes directly to GLTFLoader; it creates no GLB download link or object URL. Resource failure or authentication failure uses the same composition fallback. Keys must be present in the client bundle; they are not server secrets. Local raw inputs remain in ignored `qa/`, outside the served public directory.

For a licensed local reproduction, convert and optimize the creator files, retain the optimized inputs in `qa/assets/converted-local-only/`, then run:

```sh
pnpm models
pnpm models:package
pnpm build
```

Generated `.device-assets/` is local and ignored by Git. The production release is uploaded from a verified local build, not rebuilt from a GitHub checkout lacking those assets. See [release instructions](RELEASE.md).

Original SHA-256:

```text
studio_display.usdz   30c3062a9dc6fa379afa971a343c6d97442a35340e03618b40442f865d62b4e2
iPhone+18+Pro+Max.fbx  79d4dd7ee39df75a31564f70e471b892d0203f206d79faa4f525d126e16e2982
```

## Conversion and rendering

`scripts/convert-devices.mjs` reads copies in `qa/assets/studio-display.usdz` and `qa/assets/iphone.fbx` through the local Vite server. It selects one phone from the multi-device FBX, removes the Studio Display's occluding proxy/glass layers, identifies the screen mesh and exports GLB. Unsupported HEIC/Cinema 4D materials are replaced with web PBR materials; visual parity with the author's original renderer is not claimed.

`scripts/optimize-devices.mjs` deduplicates, welds and prunes the result, then applies Meshopt with 16-bit positions/UVs and 12-bit normals. It does not run triangle simplification. Converted files are 456,204 bytes (Studio Display) and 597,312 bytes (iPhone); exact hashes are in [device-models.json](verification/device-models.json). Run conversion before optimization when reproducing before/after sizes.

The viewer rebuilds normalized UV coordinates from the actual screen geometry, including the rounded phone boundary. Optimization can discard unused UVs before the dynamic texture is assigned. Horizontal model proportion is calibrated to the native screen aspect so small proportion errors in the supplied mesh do not stretch the wallpaper. This is a screen presentation calibration, not a physical casing measurement.

The screen uses an unlit sRGB CanvasTexture with tone mapping disabled. Device lighting does not tint the wallpaper. Texture resolution is 1320 × 2868 for iPhone and 5120 × 2880 for Studio Display, capped only by the reported GPU texture limit. Renderer DPR is capped at 3, with antialiasing and available anisotropic filtering. A reduced texture resolution is disclosed in the preview. The PNG is rendered separately from the same scene at the pinned output resolution.

Texture and device belong to the same Three.js scene. Pointer/touch dragging rotates the whole model; left/right buttons and front reset provide button access. Rendering occurs on change, resize or interaction, including a bounded 260 ms rotation tween for buttons, without a continuous idle loop. GPU resources are disposed when changing modes/devices. Failed mesh loads and lost WebGL contexts return to the composition preview.

## Output sizes and compatibility

[Apple iPhone 18 Pro Max specifications](https://support.apple.com/en-asia/148591) list 1320 × 2868; [Studio Display specifications](https://www.apple.com/ca/studio-display/specs/) list 5120 × 2880. Presets use these output dimensions.

New blank visits start with the native iPhone preset and 3D view. Existing custom-size links retain their original artwork in **Komposisi**. Choosing **Perangkat 3D** explicitly selects the current model's native size. Changing device in 3D updates output size as well; Composition also switches native preset dimensions when starting from either device preset. Choosing the current screen size returns to composition view if it does not match a model. Date, clock, casing and stand are preview-only and never included in PNG export.

## Verification boundary

`e2e/device.spec.ts` compares wallpaper pixels uploaded to the GPU with the downloaded PNG (lower half excludes the clock), checks native resolutions, canvas changes during rotation/Dim, front reset, legacy-size preservation and missing-model recovery. Screenshots verify visible wallpaper within the screen at front and rotated angles. [device-browser.json](verification/device-browser.json) records Chrome/WebKit viewport, DPR, texture size, accessibility checks and runtime errors. Headless browser emulation is not a physical iPhone/GPU test.
