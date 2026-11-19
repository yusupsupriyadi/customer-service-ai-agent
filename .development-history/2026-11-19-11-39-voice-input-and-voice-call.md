# Voice input (Level 3) and voice call (Level 4) with Deepgram

## Summary

Added two voice features and their tutorial levels. Level 3: a Rekam button records the mic, Deepgram nova-3 (`language=id`) transcribes it, and the text is sent through the normal chat form. Level 4: a Telepon button starts a hands-free call loop: Deepgram live WebSocket STT, Netra answer, Deepgram Aura TTS played while streaming, then listen again. A Deepgram API key field (show/hide, remember) was added to Settings.

## Changes

- `index.html` app: Deepgram key field, Rekam and Telepon buttons, black call bar; `voiceStatus` and `callStatus` in state; shared `renderChatControls`, `showError`, `getMicrophone`, `setupKeyField`; call loop with recorder pause during agent turns, KeepAlive every 5 s, MediaSource MP3 streaming with blob fallback; Netra 401 message now names the Netra key.
- `index.html` tutorial: Level 3 (steps 9-11) and Level 4 (steps 12-14) with tests, TOC, prep (Deepgram key), troubleshooting, security, exercises; inline code may wrap on mobile.
- `README.md`: voice features, flow, security note.

## Decisions

- TTS voice `aura-2-livia-it`: Deepgram has no Indonesian voice; in a round-trip test (TTS then nova-3 `id` STT) it was the most intelligible of 9 English/Spanish/Italian voices. Call prompt asks for numbers written as words.
- Live URL uses `endpointing=500`: the default 10 ms split utterances and dropped words, which fired `UtteranceEnd` early. The turn also waits for pending interim text.
- Recorder is paused (not muted) while the agent thinks and speaks, so the agent's voice is never transcribed.

## Verification

- `node --check` on the inline script: OK. Page checker: no duplicate ids, all anchors and copy targets exist, heading order valid, 25 excerpts match script/style exactly, no em dash.
- BrowserOS Neo on `file://` with real Deepgram calls and a synthetic mic (TTS audio into a MediaStream): Level 3 record, transcribe, send; Level 4 greeting, 3 turns in one call with complete sentences, 12 s Netra delay survived via KeepAlive, end call mid-speech, bad Deepgram key (call and record), Netra 401 during a call; 375 px layout without horizontal overflow; new color pairs pass AA.

## Limitations

- Netra replies were stubbed (no Netra key available); real Netra latency in calls is unverified.
- Real microphone permission prompt and real human speech were not tested.

## Follow-up

- Run one real call with a valid Netra key and a real microphone.
