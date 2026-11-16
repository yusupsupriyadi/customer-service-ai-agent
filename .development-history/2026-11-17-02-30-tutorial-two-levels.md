# Tutorial split into two levels

## Summary

The user found the PDF part too challenging for a first pass, so the tutorial now has two levels: Level 1 (text context only, steps 1-5 plus a test) and Level 2 (PDF context, steps 6-8 plus a test). The app itself is unchanged and still includes PDF support.

## Changes

- `index.html` tutorial: new intro and data flow; Level 1 and Level 2 banner sections; Level 1 shows simplified `state`, `el`, and `buildContext` (labelled "versi Tingkat 1"); Level 2 adds the PDF input, `documents` state, pdf.js reading, and the full `buildContext`; troubleshooting and exercises split by level; one new Level 2 exercise (PDF text preview).
- `index.html` style: `.tier` banner style; TOC grouped by level, capped to the viewport height with its own scroll on desktop.
- `README.md`: describes the two levels.

## Decisions

- Steps numbered continuously (1-8) so references like "Langkah 3" stay unambiguous across levels.
- Level 1 simplified excerpts are labelled as such instead of changing the app code.

## Verification

- Node check: no duplicate real ids, all anchors and copy targets exist, heading order valid, 10 excerpts match the script/style exactly, Level 1 excerpts are valid JS and their state fields exist in the real state.
- BrowserOS Neo (local file): both level banners render, TOC scrolls at 600px height, no horizontal overflow at 375px.

## Limitations

- Real API reply still unverified.

## Follow-up

- None.
