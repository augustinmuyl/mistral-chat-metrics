import { describe, it, expect } from "vitest";
import type { NextRequest } from "next/server";
import { POST, OPTIONS } from "../../src/app/api/chat/route";

describe("origin lock", () => {
  it("allows POST from allowed origin", async () => {
    process.env.MOCK = "1";
    process.env.ALLOWED_ORIGIN = "http://localhost:3000";
    const body = {
      model: "mistral-large-latest",
      messages: [{ id: "u1", role: "user", content: "Hi" }],
      stream: true,
    };
    const req = new Request("http://localhost/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        origin: "http://localhost:3000",
      },
      body: JSON.stringify(body),
    });
    const res = await POST(req as unknown as NextRequest);
    expect(res.status).toBe(200);
    expect(res.headers.get("access-control-allow-origin")).toBe(
      "http://localhost:3000",
    );
  });

  it("blocks POST from disallowed origin", async () => {
    process.env.MOCK = "1";
    process.env.ALLOWED_ORIGIN = "http://localhost:3000";
    const body = {
      model: "mistral-large-latest",
      messages: [{ id: "u1", role: "user", content: "Hi" }],
      stream: true,
    };
    const req = new Request("http://localhost/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        origin: "http://evil.local",
      },
      body: JSON.stringify(body),
    });
    const res = await POST(req as unknown as NextRequest);
    expect(res.status).toBe(403);
  });

  it("OPTIONS preflight allows allowed origin", async () => {
    process.env.ALLOWED_ORIGIN = "http://localhost:3000";
    const req = new Request("http://localhost/api/chat", {
      method: "OPTIONS",
      headers: {
        origin: "http://localhost:3000",
        "access-control-request-method": "POST",
        "access-control-request-headers": "content-type",
      },
    });
    const res = await OPTIONS(req as unknown as NextRequest);
    expect(res.status).toBe(204);
    expect(res.headers.get("access-control-allow-origin")).toBe(
      "http://localhost:3000",
    );
  });

  it("OPTIONS preflight blocks disallowed origin", async () => {
    process.env.ALLOWED_ORIGIN = "http://localhost:3000";
    const req = new Request("http://localhost/api/chat", {
      method: "OPTIONS",
      headers: {
        origin: "http://evil.local",
      },
    });
    const res = await OPTIONS(req as unknown as NextRequest);
    expect(res.status).toBe(403);
  });
});

