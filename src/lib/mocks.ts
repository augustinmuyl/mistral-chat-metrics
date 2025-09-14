import type { StreamChunk } from "./schemas";

export function mockChunks(): StreamChunk[] {
  const t0 = Date.now();
  return [
    { type: "meta", t0, mock: true },
    { type: "delta", content: "Hello" },
    { type: "delta", content: ", this is a mock." },
    { type: "final", usage: { prompt: 5, completion: 6 } },
  ];
}

