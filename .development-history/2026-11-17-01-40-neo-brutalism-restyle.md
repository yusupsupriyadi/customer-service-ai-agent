# Colorful neo-brutalism restyle

## Summary

Restyled the whole page (app and tutorial) to the user's direction "color full dan brutalism": thick black borders, hard offset shadows, square corners, and a three-color palette with fixed roles.

## Changes

- `index.html` style block: `@theme` tokens (pop yellow/pink/cyan, cream, Archivo fonts, hard shadows) and components `panel`, `panel-bar`, `btn`, `field`, `field-label`, `hint`, `bubble`; tutorial `.doc`, code block, and TOC styles updated.
- `index.html` markup and script: app panels, buttons, inputs, chat bubbles, PDF list, context box, empty/loading/error states, tutorial header, TOC, article, troubleshooting list, and footer use the new components.
- Tutorial Step 1: new subsection explaining `@theme` tokens and `@apply` components, with two excerpts; `createBubble` excerpt updated.

## Decisions

- Color roles: yellow = header/navigation, pink = customer and Send, cyan = agent and settings; red only for errors. Black text on every color.
- Archivo Black for headings (poster-like weight fits brutalism), Archivo for body text.
- From the industrial-brutalist skill only square corners, thick borders, and Archivo Black were kept; its single-red palette conflicts with the user's colorful direction.

## Verification

- Node check: anchors, copy targets, heading order, one `<main>`/`<h1>`, 10 code excerpts match the script or style block, script passes `node --check`.
- BrowserOS Neo (local file): fonts loaded, desktop and 375px views with no horizontal overflow, bubbles/error/PDF list rendered, keyboard focus outline visible; test data removed from localStorage afterwards.

## Limitations

- Real API reply still unverified.

## Follow-up

- None.
