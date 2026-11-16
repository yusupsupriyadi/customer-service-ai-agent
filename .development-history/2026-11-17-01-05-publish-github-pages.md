# Publish to GitHub Pages

## Summary

Published the single-page app and tutorial as a public GitHub repo with GitHub Pages, on the user's confirmation.

## Changes

- Created the git repo (branch `main`) and public repo `yusupsupriyadi/customer-service-ai-agent`.
- Enabled GitHub Pages from `main` at `/`: https://yusupsupriyadi.github.io/customer-service-ai-agent/

## Decisions

- Public repo is safe: no API key is stored in the code; users type their own key at runtime.
- `.development-history/` is kept in the repo; Pages does not serve dot-folders.

## Verification

- Pages build for commit `a05e70f`: status `built`, no error.
- `curl` on the site: HTTP 200, title "CS Agent: Aplikasi dan Tutorial", app form and tutorial heading present.
- `.development-history/` URL returns 404 on the site.

## Limitations

- Live page not yet checked in a real browser; real API reply still unverified.

## Follow-up

- Browser check of the live site and one chat with a real key.
