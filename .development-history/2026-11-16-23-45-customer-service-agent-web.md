# Customer service agent web (teaching example)

## Summary

Single-page customer service chat built with plain HTML, Tailwind (browser CDN), and JavaScript, meant as an example project for grade 11 vocational students. The user enters a Netra API key, adds text context and PDF documents, and chats as a customer.

## Changes

- `index.html`: settings panel (API key, model, text context, PDF upload) and chat panel.
- `app.js`: PDF text extraction with pdf.js 4.10.38 (lazy-loaded from cdnjs), context assembly (60,000 char cap), system prompt, call to `https://api.netra.sh/v1/chat/completions`, empty/loading/error states.
- `README.md`: how to run, file structure, flow, and the API-key-in-browser warning.

## Decisions

- No backend: Netra answers CORS preflight with `access-control-allow-origin: *`, so the browser calls the API directly.
- Classic script (not ES module) so the page works when opened via `file://`.
- Non-streaming request and plain-text replies to keep the code readable for students.
- Fixed light theme, no toggle: the user asked for a simple teaching example.

## Verification

- `node --check app.js`: OK.
- BrowserOS Neo on `file://`: no-key error, show/hide key, PDF read (text PDF OK, textless PDF rejected), remove PDF, Enter to send, loading state, invalid key gives 401 message, no horizontal overflow at 375px.

## Limitations

- A real API reply was not yet verified with a valid key.
- The API key lives in the browser; not suitable for a public site.

## Follow-up

- Run one real chat with a valid key.
