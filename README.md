# Mistral Chat + Metrics

## Overview

- Streaming chat UI for Mistral with a metrics sidebar: latency, duration, request/response KB, selected model, preset, and token counts when available.
- Model selector, system preset selector, local chat history, and a robust mock mode for development and testing.
- Built with Next.js (App Router, TypeScript), Tailwind v4, Vitest.

## Demo

> Add a short GIF or screenshot showing streaming + metrics updating.

## Features

- 🔄 Streaming chat with token-by-token reveal
- 📊 Metrics sidebar: latency, duration, request/response KB, token usage
- 🧩 Model selector and system preset selector
- 💾 Local chat history with conversation switching (persists across reloads)
- 🧪 Mock mode (deterministic responses, no API key required)
- 🛠️ Easy testing: Vitest unit + integration tests, curlable SSE API
- ⌨️ Abort support (Esc/Stop) and resilient error handling

## Requirements

- Node.js 18+ (recommended: LTS 18 or 20)
- A Mistral API key for live requests (optional; mock mode requires none)

## Setup

1. Create env file

   Copy `.env.local.example` to `.env.local` and set values:

   ```env
   MISTRAL_API_KEY=your_key_here
   MOCK=0  # set to 1 for mock mode
   ```

2. Install dependencies

   ```bash
   npm ci
   # or
   npm i
   ```

3. Start the app

   ```bash
   npm run dev
   ```

   Then open http://localhost:3000

## Usage

- Type a prompt and press Enter to stream a response.
- Switch the model and preset from the top bar (or mobile menu).
- The sidebar shows metrics in real time: latency to first token, total duration, and request/response sizes in KB; tokens appear if the upstream response includes usage.
- Press Esc or click Stop to abort a stream. Use “New chat” to start a fresh conversation without deleting previous ones.
- On reload, you land on the initial screen; conversations are loaded and can be opened from the Conversations menu.
- Conversation titles are auto-generated from the first message (sanitized and truncated) to remain readable.
- Large inputs: the composer auto-grows up to a max height, then becomes scrollable so the layout stays stable when pasting long text.

## Mock Mode

- Run without an API key and get deterministic streamed responses. Two ways to enable:

  ```bash
  # Option A: set env at runtime
  MOCK=1 npm run dev

  # Option B: set in .env.local
  # MOCK=1
  ```

- The top bar shows a “Mock mode” badge once the first `meta` event is received.

## API

- Endpoint: `POST /api/chat` (SSE response; `Content-Type: text/event-stream`)
- Request body:

  ```json
  {
    "model": "mistral-large-latest",
    "messages": [{ "id": "u1", "role": "user", "content": "Hello" }],
    "stream": true,
    "preset": "general" // optional; injected as a system message server-side
  }
  ```

- Response shape: server-sent events, each line like `data: { ... }` followed by a blank line. The stream always follows this order:
  - `meta` (first) → one or more `delta` chunks → `final` (last)

- Example manual test with curl (SSE):

  ```bash
  curl -N -H 'Content-Type: application/json' \
    -d '{
      "model": "mistral-large-latest",
      "messages": [{"id":"u1","role":"user","content":"Hi"}],
      "stream": true,
      "preset": "general"
    }' \
    http://localhost:3000/api/chat
  ```

  In mock mode you will see a short, deterministic sequence ending with `final`.

## Architecture

```
[User Input] → [Next.js API /api/chat] → [Mistral SDK] → [Mistral API]
      ↑                                           ↓
   UI updates  ← stream of { meta | delta | final } events (SSE)
```

- Normalized streaming contract: `meta` (first) → one or more `delta` → `final` (last)
  - `meta`: `{ t0, mock }` marks stream start and mock/live mode
  - `delta`: `{ content }` token-like text chunks
  - `final`: `{ usage?: { prompt, completion } }` if usage is available
- Presets: when provided, injected server-side as a system message.
- Mock mode: `MOCK=1` returns deterministic chunks for fast, keyless dev and stable tests.
- Abort: client abort signal is wired through to the server route and upstream SDK.
- Runtime: Node for compatibility with the official SDK.

## Repository Conventions

- `src/app/api/chat/route.ts`: Server route that normalizes upstream streaming into `meta`/`delta`/`final`. Uses `@mistralai/mistralai` when `MISTRAL_API_KEY` is set; otherwise returns `final` or mock chunks if `MOCK=1`.
- `src/lib/*`: Typed schemas, metrics utilities, streaming client, local mocks, and localStorage helpers.
- `src/components/*`: UI (chat list, composer, sidebar metrics, selectors, top bar).
- `tests/*`: Vitest unit and integration tests.

## Scripts

- `dev`: `next dev --turbopack`
- `build`: `next build --turbopack`
- `start`: `next start`
- `lint`: `eslint`
- `format`: `prettier --write .`
- `test`: `vitest`

## Testing

This project is designed to be easy to test locally and in CI.

- Run all tests:

  ```bash
  npm run test
  ```

- Test environments are configured in `vitest.config.ts`:
  - `jsdom` for unit tests (UI-adjacent utilities)
  - `node` for integration tests under `tests/integration/**`

- Integration coverage includes the end-to-end SSE contract of `/api/chat`:
  - Verifies the stream order: `meta` → ≥1 `delta` → `final`
  - Uses `MOCK=1` to avoid external calls and ensure determinism

- Run only a specific test file:

  ```bash
  npx vitest tests/integration/api.chat.test.ts
  # or
  npx vitest tests/unit/metrics.test.ts
  ```

- Watch mode while developing tests:

  ```bash
  npx vitest -w
  ```

- Manual API testing with SSE via curl is shown in the API section above.

## Development Workflow

- Lint and format locally: `npm run lint && npm run format`
- Run tests in watch mode: `npx vitest -w`
- Offline dev: set `MOCK=1` in your environment to avoid external calls
- Optional: Add a pre-push hook (e.g., Husky) to run lint + tests

## Environment Variables

- `MISTRAL_API_KEY`: Your Mistral key for live requests; leave unset to avoid calling the API.
- `MOCK`: `1` enables local mock streaming; `0` (or unset) disables.

## Future Improvements

- Compare mode to run multiple models side-by-side
- Document uploads with lightweight retrieval-augmented chat
- Simple evaluation dashboard (thumbs up/down, export CSV)
- Containerization via Docker and docker-compose for one-command setup

## Limitations

- No server persistence; conversation history lives in the browser.
- Token usage is displayed only if provided by the upstream response.
- The API route targets the Node runtime due to the official SDK; not configured for Edge.

## Troubleshooting

- Getting an immediate `final` with no `delta`: ensure `MISTRAL_API_KEY` is set for live mode, or enable `MOCK=1` for mock streaming.
- Caught by CORS when calling `/api/chat` directly from another origin: use the provided UI or proxy requests through the same Next.js app.
- Types or ESLint errors: run `npm run lint` and `npm run format`.

## Acknowledgments

- [Mistral AI SDK](https://docs.mistral.ai)
- [shadcn/ui](https://ui.shadcn.com) for composable primitives

## License

MIT
