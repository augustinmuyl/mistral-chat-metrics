export type Message = {
  id: string;
  role: "system" | "user" | "assistant";
  content: string;
  preset?: string;
  model?: string;
};

export type MetaChunk = { type: "meta"; t0: number; mock?: boolean };
export type DeltaChunk = { type: "delta"; content: string };
export type FinalChunk = {
  type: "final";
  usage?: { prompt?: number; completion?: number };
};

export type StreamChunk = MetaChunk | DeltaChunk | FinalChunk;

