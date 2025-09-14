import { StreamChunkSchema, type Message, type StreamChunk } from "./schemas";

export type StreamCallbacks = {
  onMeta?: (chunk: Extract<StreamChunk, { type: "meta" }>) => void;
  onDelta?: (chunk: Extract<StreamChunk, { type: "delta" }>) => void;
  onFinal?: (chunk: Extract<StreamChunk, { type: "final" }>) => void;
  onError?: (error: unknown) => void;
  onClose?: () => void;
};

export type StreamRequestBody = {
  model: string;
  messages: Message[];
  stream?: boolean;
  preset?: string;
};

export type StreamController = {
  abort: () => void;
};

export function streamChat(
  body: StreamRequestBody,
  callbacks: StreamCallbacks,
): StreamController {
  const ac = new AbortController();
  const { signal } = ac;

  void (async () => {
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, stream: true }),
        signal,
      });

      if (!res.ok || !res.body) {
        throw new Error(`Request failed: ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunkText = decoder.decode(value, { stream: true });
        buffer += chunkText;

        let idx: number;
        while ((idx = buffer.indexOf("\n")) >= 0) {
          const line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          processLine(line, callbacks);
        }
      }

      // Flush remaining buffer (in case no trailing newline)
      if (buffer.trim().length > 0) {
        processLine(buffer, callbacks);
      }
    } catch (err) {
      callbacks.onError?.(err);
    } finally {
      callbacks.onClose?.();
    }
  })();

  return {
    abort() {
      ac.abort();
    },
  };
}

function processLine(line: string, callbacks: StreamCallbacks) {
  const raw = line.trim();
  if (!raw) return;
  if (raw.startsWith(":")) return; // SSE comment

  // Support SSE-style: data: {...}
  const jsonText = raw.startsWith("data:") ? raw.slice(5).trim() : raw;
  try {
    const obj = JSON.parse(jsonText);
    const parsed = StreamChunkSchema.safeParse(obj);
    if (!parsed.success) return; // Ignore unknown formats
    const chunk = parsed.data;
    switch (chunk.type) {
      case "meta":
        callbacks.onMeta?.(chunk);
        break;
      case "delta":
        callbacks.onDelta?.(chunk);
        break;
      case "final":
        callbacks.onFinal?.(chunk);
        break;
      default:
        break;
    }
  } catch (e) {
    callbacks.onError?.(e);
  }
}
