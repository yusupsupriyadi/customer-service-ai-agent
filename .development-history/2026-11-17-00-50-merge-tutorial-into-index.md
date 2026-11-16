# Merge tutorial into index.html

## Summary

At the user's request, the tutorial now lives in `index.html` below the app, so the whole project is one page. `tutorial.html` was removed.

## Changes

- `index.html`: one `<main>` wraps the app grid (`#app-main`) and a new `#tutorial` section (table of contents + article); tutorial styles added to the Tailwind style block; header link points to `#tutorial`; copy-button code added to the main script; references moved to the footer.
- `tutorial.html`: headings shifted one level (h2 to h3, h3 to h4) and inserted verbatim, then the file was removed.
- `README.md`: file table now lists only `index.html`.

## Decisions

- App first, tutorial below with in-page anchors, instead of tabs: no routing code, simpler for students.
- Tutorial fragment inserted without re-indenting so `<pre>` code samples keep their exact whitespace.

## Verification

- Node check: one `<main>`, one `<h1>`, no skipped heading levels, all in-page anchors and copy targets exist, 8 code excerpts match the inline script, script passes `node --check`.
- Duplicate-id warning for `api-key` is text inside an escaped code sample; only one real element.

## Limitations

- Not opened in a browser after this change; real API reply still unverified.

## Follow-up

- Browser check and publish once the user confirms.
