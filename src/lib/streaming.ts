import type { Message, StreamChunk } from "./schemas";

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
  _body: StreamRequestBody,
  _callbacks: StreamCallbacks
): StreamController {
  let aborted = false;
  return {
    abort() {
      aborted = true;
    },
  };
}

