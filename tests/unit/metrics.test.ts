import {
  accumulateResponseBytes,
  byteLengthOfString,
  bytesToKB,
  computeDurationMs,
  computeLatencyMs,
  jsonByteLength,
} from "../../src/lib/metrics";

describe("metrics helpers", () => {
  it("converts bytes to KB with rounding", () => {
    expect(bytesToKB(1024)).toBe(1);
    expect(bytesToKB(2048)).toBe(2);
  });

  it("computes latency and duration as non-negative integers", () => {
    expect(computeLatencyMs(1000, 1105)).toBe(105);
    expect(computeLatencyMs(1105, 1000)).toBe(0);
    expect(computeDurationMs(1000, 2500)).toBe(1500);
    expect(computeDurationMs(2500, 1000)).toBe(0);
  });

  it("measures string and JSON byte length", () => {
    const s = "héllo"; // multi-byte
    const expected = new TextEncoder().encode(s).length;
    expect(byteLengthOfString(s)).toBe(expected);

    const obj = { a: "x", n: 1 };
    const json = JSON.stringify(obj);
    const expectedJson = new TextEncoder().encode(json).length;
    expect(jsonByteLength(obj)).toBe(expectedJson);
  });

  it("accumulates response bytes for strings and Uint8Array", () => {
    let total = 0;
    total = accumulateResponseBytes(total, "hi");
    expect(total).toBe(byteLengthOfString("hi"));
    const chunk = new TextEncoder().encode("there");
    total = accumulateResponseBytes(total, chunk);
    expect(total).toBe(byteLengthOfString("hithere"));
  });
});
