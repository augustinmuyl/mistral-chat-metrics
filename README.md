# Mistral Chat + Metrics

## Overview

- Streaming chat UI for Mistral with a metrics sidebar (latency, duration, request/response KB, model, preset, tokens where available).
- Model selector, system preset selector, local history, and mock mode.
- Next.js (App Router, TypeScript), Tailwind v4, Vitest tests.

## Quickstart

- Prerequisites: Node 18+, a Mistral API key (optional for mock).
- Setup:
  1. Copy `.env.local.example` to `.env.local` and fill values:

     ```env
     MISTRAL_API_KEY=your_key_here
     MOCK=0  # set to 1 to run mock mode
     ```

  2. Install deps:

     ```bash
     npm ci
     # or
     npm i
     ```

  3. Start dev server:

     ```bash
     npm run dev
     ```

  4. Open http://localhost:3000

## Mock Mode

- Run without an API key using mock streaming:

  ```bash
  MOCK=1 npm run dev
  ```

- The top bar shows a "Mock mode" badge after the first streamed `meta` event.

## Features

- Streaming replies with token-by-token UI updates.
- Metrics sidebar: latency, duration, request KB, response KB, model, preset, tokens.
- Model and system preset selectors.
- Local history (no backend database).
- Error handling and stream abort (Esc or Stop button).

## Architecture

- UI (Next.js) → `/api/chat` → Mistral.
  - `/api/chat` normalizes streaming to `meta` → `delta` → `final` as SSE data lines.
  - `MOCK=1` streams from a local mock; otherwise proxies to Mistral via the official SDK.

## Scripts

- `dev`: `next dev`
- `build`: `next build`
- `start`: `next start`
- `lint`: `eslint`
- `format`: `prettier --write .`
- `test`: `vitest`

## Testing

- Unit tests: `npm run test`
  - jsdom for UI-adjacent utils
  - Node for integration tests
- Integration test uses `MOCK=1` to verify the API stream order (`meta`, ≥1 `delta`, `final`).

## Limitations

- No server persistence; history is browser-only.
- Token usage shown only if provided by upstream.
- SDK usage targets Node runtime for the route; not configured for Edge.

## License

- MIT
