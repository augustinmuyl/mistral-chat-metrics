import { describe, it, expect } from "vitest";
import { deriveTitle } from "../../src/lib/utils";

describe("deriveTitle", () => {
  it("strips markdown and truncates", () => {
    const input = `# Title\n\nHere is some text with a [link](http://x) and \n\n\`code\` and a long long long long long long sentence that should be truncated.`;
    const title = deriveTitle(input, 40);
    expect(title.length).toBeLessThanOrEqual(40);
    expect(title).not.toMatch(/\[|\]|\(|\)|`|#|\*/);
  });

  it("prefers first sentence when short", () => {
    const input = "This is short. And here is more text.";
    expect(deriveTitle(input, 60)).toBe("This is short.");
  });

  it("falls back to default on empty/bad input", () => {
    expect(deriveTitle("", 60)).toBe("");
    // Simulate something that would throw inside deriveTitle
    // by passing a value that becomes the string "[object Object]"
    // which still should not throw and returns a non-empty title.
    const title = deriveTitle(String({}), 10);
    expect(title.length).toBeGreaterThan(0);
  });
});

