import type { StreamChunk } from "./schemas";

export function mockChunks(): StreamChunk[] {
  const t0 = Date.now();
  return [
    { type: "meta", t0, mock: true },
    { type: "delta", content: "Hi" },
    { type: "delta", content: ", this is" },
    { type: "delta", content: " a mock. " },
    { type: "delta", content: "Add an API key" },
    { type: "delta", content: " to access full features." },
    { type: "final", usage: { prompt: 5, completion: 6 } },
  ];
}
