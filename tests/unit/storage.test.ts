import {
  loadConversations,
  saveConversation,
  clearConversation,
} from "../../src/lib/storage";

describe("storage placeholders", () => {
  it("exposes functions", () => {
    expect(typeof loadConversations).toBe("function");
    expect(typeof saveConversation).toBe("function");
    expect(typeof clearConversation).toBe("function");
  });
});
