# Rewrite to Next.js with server-side keys and agent picker

## Summary

Replaced the single-file `index.html` app with a Next.js 16 app. Netra and Deepgram keys now live in `.env.local` and are used only by route handlers. Added five selectable agents (Deepgram Flux Indonesian voices) and a new yellow/black/white sticker design modeled on eksis.io, with a Motion Format style canvas hero.

## Changes

- `app/api/{chat,speak,listen-token,status}`: server proxies; system prompt built server-side; Deepgram STT uses a 30 s token (`/v1/auth/grant`, `bearer` subprotocol); same-origin check and per-IP rate limit.
- `lib/agents.ts`: Fitri, Dewi, Fajar, Rizky, Teguh (`flux-*-id`) with speaking styles.
- `lib/voice.ts`: dictation and call loop ported from the old script; token fetched before the mic prompt.
- `components/studio.tsx`, `hero-scene.tsx`, `voice-meter.tsx`, `lib/motion.ts`: UI, t-driven canvas scenes, pause control, reduced motion.
- `app/tutorial/page.tsx`: shorter 4-level tutorial; code excerpts read from project files at build.
- `README.md`, `.env.example`; removed `index.html`.

## Verification

- `tsc --noEmit`, `eslint .`, `next build`: pass.
- BrowserOS Neo with a mock Netra server: chat reply carries agent Dewi and reasoning `low`; agent/reasoning/context persist; missing Deepgram key shows errors for preview, mic, and call; 375 px has no horizontal overflow; cross-site POST returns 403.

## Limitations

- No real Netra/Deepgram keys available: real replies, voices, STT, and call loop unverified.
- GitHub Pages can no longer run the app (needs a server).

## Follow-up

- Fill `.env.local`, run one real call; deploy to Vercel if a public URL is needed.
