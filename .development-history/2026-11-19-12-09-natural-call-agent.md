# Natural-sounding call agent

## Summary

The phone agent now behaves like a human CS: it greets by time of day and introduces itself as Fitri, says a holding line ("Oke Kak, sebentar ya, saya cek dulu.") when Netra has not answered within 1 s, says "Masih saya cek ya Kak..." after 6 more seconds, and opens the answer with "Makasih sudah menunggu ya Kak." The prompt now asks for warm, spoken, polite Indonesian and calls the customer "Kak".

## Changes

- `index.html` app: `AGENT_NAME`, new `CALL_RULES`; extra base prompt rule for a warm tone (chat and call); `CHECKING_LINES`, `STILL_CHECKING_LINE`, `THANKS_FOR_WAITING_LINES`, `SMALL_TALK`; `buildGreeting`, `needsChecking`, `settlesWithin`, `getLineAudio` cache, `preloadLines`, `sayWhileChecking`, `speak`; `answerCustomer` races the Netra request against the filler timers.
- `index.html` tutorial: Langkah 3 explains the tone rule; Langkah 14 adds "Supaya terdengar seperti customer service sungguhan" with excerpts; Mencoba Tingkat 4 and Latihan updated.
- `README.md`: call flow notes.

## Decisions

- Holding lines play only when the reply is slow, and not for short small talk ("oke makasih"), so they do not feel scripted.
- Holding-line audio is fetched once per call in the background and played from a blob, so it starts instantly.
- The agent name follows the chosen voice (Fitri); change `AGENT_NAME` to rename.

## Verification

- `node --check`: OK. Page checker: 28 excerpts match, no duplicate ids, no em dash.
- BrowserOS Neo (synthetic mic, real Deepgram, stubbed Netra): 3 s reply gives filler then thanks plus answer; 10 s reply adds the still-checking line; 0.3 s reply and "Oke makasih" give no filler; Netra 401 after a filler removes the question and filler and ends the call with the error.

## Limitations

- Netra replies stubbed; real model tone and latency unverified.

## Follow-up

- Run one real call with a valid Netra key.
