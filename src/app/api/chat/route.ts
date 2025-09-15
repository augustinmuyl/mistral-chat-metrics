import { NextRequest } from "next/server";
import { MessageSchema } from "@/lib/schemas";
import { mockChunks } from "@/lib/mocks";
import { Mistral } from "@mistralai/mistralai";

export const runtime = "nodejs";

type Body = {
  model: string;
  messages: Array<unknown>;
  stream?: boolean;
  preset?: string;
};

const encoder = new TextEncoder();

// CORS / Origin lock helpers
function parseAllowedOrigins(): string[] {
  const raw = process.env.ALLOWED_ORIGIN || "http://localhost:3000";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function getRequestOrigin(req: NextRequest): string | null {
  const origin = req.headers.get("origin");
  if (origin) return origin;
  const ref = req.headers.get("referer");
  if (!ref) return null;
  try {
    return new URL(ref).origin;
  } catch {
    return null;
  }
}

function matchAllowedOrigin(req: NextRequest): string | null {
  const origins = parseAllowedOrigins();
  const reqOrigin = getRequestOrigin(req);
  if (!reqOrigin) return null;
  return origins.find((o) => o === reqOrigin) || null;
}

function send(
  controller: ReadableStreamDefaultController<Uint8Array>,
  obj: unknown,
) {
  const line = `data: ${JSON.stringify(obj)}\n\n`;
  controller.enqueue(encoder.encode(line));
}

function sseHeaders(allowedOrigin: string) {
  const h = new Headers({
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
    "Access-Control-Allow-Origin": allowedOrigin,
    Vary: "Origin",
  });
  return h;
}

export async function POST(req: NextRequest) {
  // Enforce origin lock before any work
  const allowed = matchAllowedOrigin(req);
  if (!allowed) {
    return new Response("Forbidden", {
      status: 403,
      headers: { Vary: "Origin" },
    });
  }

  const t0 = Date.now();
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }

  const { model, messages, preset } = body || {};
  if (!model || !Array.isArray(messages)) {
    return new Response("Missing model or messages", { status: 400 });
  }

  // Validate messages structure
  const validMessages = [] as Array<ReturnType<typeof MessageSchema.parse>>;
  try {
    for (const m of messages) validMessages.push(MessageSchema.parse(m));
  } catch {
    return new Response("Invalid messages", { status: 400 });
  }

  const isMock = process.env.MOCK === "1";
  const apiKey = process.env.MISTRAL_API_KEY;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        // Always emit meta first
        send(controller, { type: "meta", t0, mock: isMock });

        if (isMock) {
          // Simulate streaming with small delays
          const chunks = mockChunks();
          for (const ch of chunks) {
            await new Promise((r) =>
              setTimeout(r, ch.type === "delta" ? 150 : 0),
            );
            send(controller, ch);
          }
          controller.close();
          return;
        }

        if (!apiKey) {
          // No key — gracefully finish with final
          send(controller, { type: "final" });
          controller.close();
          return;
        }

        // Forward to Mistral using official SDK streaming
        const upstreamMessages = (
          preset
            ? [{ role: "system", content: preset }, ...validMessages]
            : validMessages
        ) as Array<{ role: "system" | "user" | "assistant"; content: string }>;

        const client = new Mistral({ apiKey });

        let aborted = false;
        const abortHandler = () => {
          aborted = true;
        };
        req.signal.addEventListener("abort", abortHandler);

        let lastUsage: { prompt?: number; completion?: number } | undefined;

        try {
          const result = await client.chat.stream({
            model,
            messages: upstreamMessages,
          });

          for await (const chunk of result) {
            if (aborted) break;
            const data = chunk.data;
            const choice = data?.choices?.[0];
            const content: unknown =
              choice?.delta?.content ??
              choice?.message?.content ??
              data?.content;
            if (typeof content === "string" && content.length > 0) {
              send(controller, { type: "delta", content });
            }
            const usage = data?.usage;
            if (usage && (usage.prompt_tokens || usage.completion_tokens)) {
              lastUsage = {
                prompt: usage.prompt_tokens,
                completion: usage.completion_tokens,
              };
            }
          }
        } finally {
          req.signal.removeEventListener("abort", abortHandler);
        }

        // Emit final with usage if known and close
        if (lastUsage) send(controller, { type: "final", usage: lastUsage });
        else send(controller, { type: "final" });
        controller.close();
      } catch {
        // Best-effort graceful close
        try {
          send(controller, { type: "final" });
        } catch {}
        controller.close();
      }
    },
    cancel() {
      // nothing specific: req.signal already wired to upstream
    },
  });

  return new Response(stream, { headers: sseHeaders(allowed) });
}

export async function OPTIONS(req: NextRequest) {
  const allowed = matchAllowedOrigin(req);
  if (!allowed) {
    return new Response("Forbidden", {
      status: 403,
      headers: { Vary: "Origin" },
    });
  }
  const h = new Headers({
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "600",
    Vary: "Origin",
  });
  return new Response(null, { status: 204, headers: h });
}
