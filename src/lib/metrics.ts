export type Metrics = {
  latencyMs?: number;
  durationMs?: number;
  requestBytes?: number;
  responseBytes?: number;
};

export function bytesToKB(bytes: number) {
  return Math.round((bytes / 1024) * 100) / 100;
}

