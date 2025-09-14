export type Metrics = {
  latencyMs?: number;
  durationMs?: number;
  requestBytes?: number;
  responseBytes?: number;
};

export function bytesToKB(bytes: number) {
  return Math.round((bytes / 1024) * 100) / 100;
}

export function computeLatencyMs(t0: number, firstDeltaAt: number) {
  return Math.max(0, Math.round(firstDeltaAt - t0));
}

export function computeDurationMs(t0: number, streamClosedAt: number) {
  return Math.max(0, Math.round(streamClosedAt - t0));
}

export function byteLengthOfString(s: string): number {
  if (typeof TextEncoder !== "undefined") {
    return new TextEncoder().encode(s).length;
  }
  // Node fallback if needed
  if (typeof Buffer !== "undefined") {
    return Buffer.byteLength(s);
  }
  // Very rare fallback
  return s.length;
}

export function jsonByteLength(obj: unknown): number {
  try {
    const json = JSON.stringify(obj);
    return byteLengthOfString(json);
  } catch {
    return 0;
  }
}

export function accumulateResponseBytes(current: number, chunk: string | Uint8Array): number {
  const add = typeof chunk === "string" ? byteLengthOfString(chunk) : chunk.byteLength;
  return current + add;
}

