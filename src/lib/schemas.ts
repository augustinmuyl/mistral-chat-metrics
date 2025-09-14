import { z } from "zod";

export const RoleSchema = z.enum(["system", "user", "assistant"]);

export const MessageSchema = z.object({
  id: z.string().min(1),
  role: RoleSchema,
  content: z.string(),
  preset: z.string().optional(),
  model: z.string().optional(),
});

export type Message = z.infer<typeof MessageSchema>;

export const MetaChunkSchema = z.object({
  type: z.literal("meta"),
  t0: z.number(),
  mock: z.boolean().optional(),
});

export const DeltaChunkSchema = z.object({
  type: z.literal("delta"),
  content: z.string(),
});

export const FinalChunkSchema = z.object({
  type: z.literal("final"),
  usage: z
    .object({
      prompt: z.number().optional(),
      completion: z.number().optional(),
    })
    .optional(),
});

export const StreamChunkSchema = z.union([
  MetaChunkSchema,
  DeltaChunkSchema,
  FinalChunkSchema,
]);

export type MetaChunk = z.infer<typeof MetaChunkSchema>;
export type DeltaChunk = z.infer<typeof DeltaChunkSchema>;
export type FinalChunk = z.infer<typeof FinalChunkSchema>;
export type StreamChunk = z.infer<typeof StreamChunkSchema>;
