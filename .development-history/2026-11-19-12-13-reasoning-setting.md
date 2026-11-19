# Reasoning setting in the web UI

## Summary

The Settings panel now has a "Reasoning" select (Mati, Rendah, Tinggi) that controls the `reasoning` field sent to Netra for both chat and calls. Tinggi stays the default, matching the previous `{ enabled: true }` behaviour. The choice is saved in localStorage.

## Changes

- `index.html` app: `#reasoning` select with hint; `REASONING_OPTIONS` (`off` = `{ enabled: false }`, `low`/`high` = `{ enabled: true, effort }`), `DEFAULT_REASONING`, `getReasoning()`; `askAgent` takes a 4th `reasoning` argument; `select` added to the pointer-cursor base rule; value persisted under `csagent.reasoning`.
- `index.html` tutorial: Langkah 1 mentions the select; Langkah 4 adds "Mengatur reasoning dari panel Pengaturan" with excerpts; Latihan items for Level 1 and 4 updated.
- `README.md`: usage note.

## Decisions

- Values follow the Netra chat-requests docs: `enabled: false` turns thinking off; DeepSeek V4 accepts `low`, `high`, `max`.
- `max` is not offered: with `max_tokens: 2048` long thinking can use up the budget before the answer is written.

## Verification

- `node --check`: OK. Page checker: 30 excerpts match, no duplicate ids.
- BrowserOS Neo: request bodies were `{enabled:false}`, `{enabled:true,effort:"low"}`, `{enabled:true,effort:"high"}` for the three options; choice persisted across reload; test value removed from localStorage afterwards.

## Limitations

- Not verified against the real Netra API (no key available); request shape follows the docs.

## Follow-up

- Compare Mati and Tinggi latency on a real call with a valid Netra key.
