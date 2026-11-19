# Realtime mic dictation and Fitri voice

## Summary

The Level 3 record button is now an icon-only mic button with realtime transcription: audio streams over the Deepgram WebSocket and text appears in the question box while the customer speaks, instead of uploading a file after recording. The call agent now speaks with Deepgram Flux TTS voice `flux-fitri-id` (native Indonesian) instead of the Italian Aura voice.

## Changes

- `index.html` app: mic SVG button with `aria-label` and stop icon; `dictation` object, `openDeepgramSocket` and `collectTranscript` shared by Level 3 and 4; `CloseStream` on stop, final text submitted on socket close; question box read-only while recording; mic stays enabled while the agent replies (keeps keyboard focus); REST `/v1/listen` code removed; TTS URL `https://api.deepgram.com/v2/speak?model=flux-fitri-id&encoding=mp3`.
- `index.html` tutorial: steps 9-11 rewritten for the mic button and WebSocket streaming; step 13 now covers turn-taking only; voice section explains Flux and `/v2/speak`; troubleshooting adds "Sambungan ke Deepgram terputus".
- `README.md`: Level 3 flow and voice notes.

## Decisions

- Flux models only work on `/v2/speak` (`/v1/speak` returns `V2_MODEL_ON_V1_SPEAK_ENDPOINT`), which is why the `/v1/models` listing did not show Fitri.
- Kept the call prompt rule "write numbers as words": Fitri reads "Rp10.000" correctly but reads "17.00" as "satu tujuh ribu".
- On an unexpected socket close, interim text is kept in the box and nothing is sent.

## Verification

- `node --check`: OK. Page checker: no duplicate ids, anchors and copy targets exist, 24 excerpts match, no em dash.
- BrowserOS Neo with synthetic mic and real Deepgram: live text updates while speaking, stop sends final text, typed prefix kept, silent stop error, bad key error, dropped socket keeps text, focus stays on mic; call with Fitri voice plays via MediaSource ~1 s after request; 375 px without overflow.

## Limitations

- Netra replies still stubbed; real microphone and human speech untested.

## Follow-up

- Run one real call with a valid Netra key and a real microphone.
