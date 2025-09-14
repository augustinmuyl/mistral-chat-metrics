# Mistral Chat + Metrics — V1 Build Steps

> Scope: a polished **chat UI** with **streaming replies**, a **metrics sidebar** (latency, duration, bytes, model, preset, tokens if available), **model selector**, **system preset selector**, **local history**, and a thin **API proxy** to Mistral.
> Assumption: a default **Next.js** (App Router, TypeScript) project already exists.

---

## 0) Prerequisites & Naming

- Project root assumed as `mistral-chat-metrics` (or your existing Next app root).
- Node ≥ 18.
- Have (or plan to add) a **Mistral API key**.

---

## 1) Initialize Dependencies & Project Hygiene

1. **Install UI & DX deps**

   ```bash
   npm i tailwindcss postcss autoprefixer @radix-ui/react-scroll-area @radix-ui/react-dropdown-menu react-markdown zod
   npm i -D @types/node @types/react @types/react-dom eslint prettier eslint-config-next husky lint-staged
   ```

2. **Tailwind setup**

   ```bash
   npx tailwindcss init -p
   ```

   - `tailwind.config.js` → set `content` to scan `./src/**/*.{ts,tsx}`.
   - Add a minimal theme if you want; ensure `src/styles/globals.css` imports tailwind base/components/utilities.

3. **Testing (V1 lightweight)**

   ```bash
   npm i -D vitest @testing-library/react @testing-library/user-event @testing-library/dom jsdom
   ```

   - Add `vitest.config.ts` with `environment: 'jsdom'`.
   - Add `test` script: `"test": "vitest"`.

4. **ESLint/Prettier**
   - Ensure `eslintConfig` in `package.json` extends `next/core-web-vitals`.
   - Add `"format": "prettier --write ."` script.
   - Optional Husky:

     ```bash
     npx husky init
     echo 'npm run lint && npm run test' > .husky/pre-push
     ```

---

## 2) Environment Variables

1. Create `./.env.local` (not committed):

   ```
   MISTRAL_API_KEY=your_key_here
   MOCK=0
   ```

2. Add example file `./.env.local.example`:

   ```
   # Copy to .env.local and fill values
   MISTRAL_API_KEY=
   MOCK=0
   ```

---

## 3) File Structure (to add)

```
src/
  app/
    layout.tsx                 # ensure Tailwind global styles imported
    page.tsx                   # Chat screen (v1)
    api/
      chat/route.ts            # API proxy (streaming + mock mode)
  components/
    Topbar.tsx
    ChatComposer.tsx
    MessageList.tsx
    SidebarMetrics.tsx
    ModelSelector.tsx
    SystemPresetSelect.tsx
    EmptyState.tsx
  lib/
    streaming.ts               # fetch reader / SSE helper
    metrics.ts                 # latency / duration / bytes helpers
    storage.ts                 # LocalStorage helpers (history)
    schemas.ts                 # Zod types for messages & chunks
    mocks.ts                   # mock streaming chunks
  styles/
    globals.css                # Tailwind base
tests/
  unit/
    metrics.test.ts
    storage.test.ts
  integration/
    api.chat.test.ts
```

Create empty files as placeholders; fill them in steps below.

---

## 4) Domain Model & Schemas

1. **Define message & chunk schemas** in `src/lib/schemas.ts`
   - `Message = { id: string; role: 'system'|'user'|'assistant'; content: string; preset?: string; model?: string; }`
   - Stream chunks (server → client):
     - `{ type: 'meta'; t0: number }`
     - `{ type: 'delta'; content: string }`
     - `{ type: 'final'; usage?: { prompt?: number; completion?: number } }`

2. Export corresponding **Zod** schemas.
   _(Purpose: runtime validation on API boundary & safer parsing.)_

---

## 5) Metrics & Storage Utilities

1. **`src/lib/metrics.ts`**
   - Export helpers to compute:
     - `latencyMs = firstDeltaAt - t0`
     - `durationMs = streamClosedAt - t0`
     - `requestBytes = Buffer.byteLength(JSON.stringify(body))` (approx in browser: `new TextEncoder().encode(json).length`)
     - `responseBytes` accumulated while reading chunks

2. **`src/lib/storage.ts`**
   - Keyed LocalStorage API:
     - `saveConversation(conversation)`
     - `loadConversations()`
     - `clearConversation(id)`

   - Safeguard with `typeof window !== 'undefined'`.

---

## 6) Streaming Helper

1. **`src/lib/streaming.ts`**
   - Implement a reader that:
     - Calls `/api/chat` with `POST` body `{model, messages, stream: true, preset}`
     - Uses `fetch` + `ReadableStream` to parse **line-delimited JSON** or **event-stream**.
     - Emits callbacks (`onMeta`, `onDelta`, `onFinal`, `onError`, `onClose`).

2. Return:
   - A small controller with `abort()` to cancel a stream mid-flight.

---

## 7) API Proxy (Server Route)

1. **`src/app/api/chat/route.ts`**
   - Accept `POST` with `{ model, messages, stream, preset }`.
   - If `process.env.MOCK === '1'` → stream from `lib/mocks.ts` with artificial delays and emit:
     - `meta` → initial timestamp
     - several `delta` chunks
     - `final` with fake usage

   - Else:
     - Forward to **Mistral** Chat endpoint with **Bearer** `MISTRAL_API_KEY`.
     - Prefer streaming API; if unavailable, stream yourself by splitting chunks.

   - Normalize upstream to your standard chunk format (`meta`, `delta`, `final`).
   - Set headers for streaming: `Content-Type: text/event-stream` (or stream `text/plain` with `\n`-delimited JSON lines), `Cache-Control: no-cache`, `Connection: keep-alive`.

2. **Error handling**
   - On error: write an error JSON line and close.
   - Always end with a `final` or a clear close to let client compute duration.

---

## 8) UI Skeleton

1. **`src/app/layout.tsx`**
   - Ensure global Tailwind classes are loaded.
   - Set a clean, centered container & basic font.

2. **`src/app/page.tsx`** (V1 composition)
   - Layout: `Topbar` (with `ModelSelector`, `SystemPresetSelect`), main area with `MessageList` and bottom `ChatComposer`. Right side `SidebarMetrics` on large screens; collapsible on mobile.
   - State:
     - `messages` (array)
     - `currentModel`, `currentPreset`
     - `metrics`: `latencyMs`, `durationMs`, `reqKB`, `respKB`, `tokens`
     - `isStreaming`

   - Wire send:
     - Build request body
     - Start timer, call streaming helper
     - On first `delta` → compute latency
     - Accumulate `content`, update `respKB`
     - On `final` → compute duration, tokens if present
     - Persist conversation to LocalStorage

3. **Components**
   - `Topbar.tsx`
     - App title, compare mode (leave for v1.5), and right-aligned actions: Mock toggle (read-only label from env), Clear history button.

   - `ModelSelector.tsx`
     - Dropdown with a few model IDs; default a known good one.

   - `SystemPresetSelect.tsx`
     - Dropdown with 3–4 presets: “Teacher”, “Coder”, “Concise”, “General”.
     - When preset changes, push a **system** message at start of conversation (or store preset separately and include in API body).

   - `MessageList.tsx`
     - Renders bubbles for user/assistant; assistant uses `react-markdown`.
     - Accessible: `aria-live="polite"` on assistant container.

   - `ChatComposer.tsx`
     - Multiline textarea; `Enter` to send, `Shift+Enter` newline.
     - Disable while streaming; add **Stop** button to abort.

   - `SidebarMetrics.tsx`
     - Stat cards for `Latency`, `Duration`, `Req KB`, `Resp KB`, `Model`, `Preset`, `Tokens`.
     - Collapsible below `md`.

4. **Empty state**
   - `EmptyState.tsx` shows a friendly prompt when no messages exist; include keyboard hints.

---

## 9) Minimal Styles (Tailwind)

- Ensure consistent padding/margins; a simple 2-column grid on `lg:`:
  - Left: chat (spans full width on mobile)
  - Right: metrics sidebar (`lg:w-80`, collapsible on mobile)

- Set max page width (`max-w-5xl mx-auto`).

---

## 10) Keyboard & A11y

- `Esc` → abort stream if active.
- Focus returns to composer after send or abort.
- All interactive elements have labels: dropdowns, buttons with `aria-label`.

---

## 11) Mock Mode

- In the UI, detect `process.env.NEXT_PUBLIC_MOCK` or a server-provided flag via an endpoint if you prefer; **for V1, read `process.env.MOCK` on the server** and show a small banner “Mock mode enabled” by also exposing a boolean from `/api/chat` first meta chunk (e.g., include `mock:true`).
- Document in README:
  - Run with mock:

    ```bash
    MOCK=1 npm run dev
    ```

---

## 12) Basic Tests (V1)

1. **`tests/unit/metrics.test.ts`**
   - Given timestamps, bytes → expect correct latency/duration/KB.

2. **`tests/unit/storage.test.ts`**
   - Mock `localStorage`; save/load/clear conversation.

3. **`tests/integration/api.chat.test.ts`**
   - Mock upstream (or set `MOCK=1`) and call the route handler; assert first line is `meta`, then ≥1 `delta`, then `final`.

---

## 13) Scripts

In `package.json`, add:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest",
    "format": "prettier --write ."
  }
}
```

---

## 14) Manual QA (Acceptance Criteria)

- [ ] **Streaming works**: visible token-by-token (or chunk-by-chunk) reveal.
- [ ] **Latency** updates at first token; **Duration** on stream end.
- [ ] **Req/Resp KB** show reasonable values.
- [ ] **Model selector** and **Preset** clearly visible; preset applied to responses.
- [ ] **Local history** persists across reloads; can clear.
- [ ] **Mock Mode** runs without API key; shows banner or label.
- [ ] **A11y**: `aria-live` on assistant, keyboard-only flow works.
- [ ] **Error state**: Turning off API returns a visible error box and the UI recovers.

---

## 15) README (V1 checklist)

- [ ] One-line description + **demo GIF** (record a short clip).
- [ ] Quickstart with `.env.local` and `MOCK` usage.
- [ ] Feature list (Streaming, Metrics, Model/Preset, Mock Mode, History).
- [ ] Simple **architecture diagram** (UI → `/api/chat` → Mistral).
- [ ] Testing instructions.
- [ ] Limitations (no DB; token usage only if provided by upstream).
- [ ] License.

---

## 16) Optional Docker (V1)

- Add a single **Dockerfile**:

  ```
  FROM node:20-alpine
  WORKDIR /app
  COPY package*.json ./
  RUN npm ci
  COPY . .
  RUN npm run build
  EXPOSE 3000
  CMD ["npm", "start"]
  ```

- **docker-compose.yml** (optional) to pass env:

  ```yaml
  services:
    web:
      build: .
      environment:
        - MISTRAL_API_KEY=${MISTRAL_API_KEY}
        - MOCK=${MOCK:-0}
      ports:
        - "3000:3000"
  ```

---

## 17) Submission Prep

- [ ] Push a clean, well-structured repo.
- [ ] Pin a small PR (e.g., “Add metrics sidebar”) to show review habits.
- [ ] If you deploy (Vercel), ensure API key is **server-side only** and functional.
- [ ] Re-run **manual QA** checklist before sharing link.

---

## 18) Timebox (Suggested)

- **Day 1**: Utilities (`schemas`, `metrics`, `storage`, `streaming`), API mock stream.
- **Day 2**: UI scaffold (Topbar, MessageList, Composer), wire mock streaming.
- **Day 3**: Real API proxy, metrics sidebar, polish and error states.
- **Day 4**: Tests, README, GIF, optional Docker, final QA.

---

**Done with V1** when:

- Chat streams reliably against both real API & mock.
- Metrics display is correct and updates live.
- README enables anyone to run in ≤2 minutes.
