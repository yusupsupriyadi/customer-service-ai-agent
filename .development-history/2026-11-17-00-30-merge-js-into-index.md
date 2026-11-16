# Merge app.js into index.html

## Summary

At the user's request, the app is now a single file: the JavaScript from `app.js` lives in an inline `<script>` at the end of `index.html`, and `app.js` was removed.

## Changes

- `index.html`: replaced `<script src="app.js">` with the full script inline.
- `app.js`: removed.
- `tutorial.html`: file tree, data flow, Step 1 script explanation, and code block labels now point to the script section of `index.html`.
- `README.md`: file table updated.

## Decisions

- Merge done by a scratchpad Node script that inserts `app.js` verbatim, so the code is byte-identical to the tested version.

## Verification

- `cmp`: inline script identical to the former `app.js`; `node --check` passes.
- Every id used by the script exists in `index.html`; 8 tutorial excerpts match the inline script exactly.
- No leftover `app.js` references; no em or en dashes.

## Limitations

- Not re-opened in a browser after the merge; real API reply still unverified.

## Follow-up

- Publish (GitHub Pages recommended) after the user confirms.
