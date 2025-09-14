import { describe, it, expect } from "vitest";
import { POST } from "../../src/app/api/chat/route";

async function readSSEChunks(res: Response) {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const chunks: any[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buffer.indexOf("\n\n")) >= 0) {
      const frame = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      const line = frame.trim();
      if (!line) continue;
      if (!line.startsWith("data:")) continue;
      const json = line.slice(5).trim();
      try {
        const obj = JSON.parse(json);
        chunks.push(obj);
      } catch {}
    }
  }
  return chunks;
}

describe("/api/chat (MOCK=1)", () => {
  it("streams meta, delta(s), and final", async () => {
    process.env.MOCK = "1";
    const body = {
      model: "mistral-large-latest",
      messages: [{ id: "u1", role: "user", content: "Hi" }],
      stream: true,
    };
    const req = new Request("http://localhost/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const res = await POST(req as any);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type") || "").toContain("text/event-stream");
    const chunks = await readSSEChunks(res);
    expect(chunks[0]?.type).toBe("meta");
    expect(chunks.some((c) => c.type === "delta")).toBe(true);
    expect(chunks[chunks.length - 1]?.type).toBe("final");
  });
});
