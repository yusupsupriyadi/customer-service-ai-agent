# Tone down to border-only brutalism

## Summary

The user found the colorful version too loud and clarified that "brutalism" should only mean the borders. Kept thick black borders and square corners; removed hard shadows, button press effects, the Archivo fonts, and the pink/cyan colors.

## Changes

- `index.html` style block: `@theme` now holds only `--color-accent` (#ffe14d) and `--color-paper` (#f5f4ef); components lost their shadows and translate effects; `.btn-white`/`.btn-pink` replaced by plain `.btn` and `.btn-accent`; Google Fonts links removed (system font again).
- Markup and script: header, panel bars, tutorial header, and footer are white; yellow only on Send, customer bubbles, step labels, the context-limit warning, and hover states; agent bubbles use paper; error box uses red-100.
- Tutorial Step 1: style subsection, `@theme` and `.field` excerpts rewritten to match.

## Decisions

- One accent color (yellow) plus neutrals; red stays for errors only.

## Verification

- Node check: anchors, copy targets, heading order, 10 excerpts match script/style, `node --check` passes; no leftovers of the colorful version.
- BrowserOS Neo (local file): no box shadows, system font, desktop and 375px with no horizontal overflow; test data cleared afterwards.

## Limitations

- Real API reply still unverified.

## Follow-up

- None.
