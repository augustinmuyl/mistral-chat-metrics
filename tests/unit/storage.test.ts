import {
  loadConversations,
  saveConversation,
  clearConversation,
  type Conversation,
} from "../../src/lib/storage";

describe("storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("saves, loads, and clears conversations", () => {
    const conv: Conversation = {
      id: "c1",
      title: "Hello",
      messages: [
        { id: "m1", role: "user", content: "Hi" },
        { id: "m2", role: "assistant", content: "Hello!" },
      ],
      model: "mistral-large-latest",
      preset: "general",
    };

    expect(loadConversations()).toEqual([]);
    saveConversation(conv);
    const loaded = loadConversations();
    expect(loaded.length).toBe(1);
    expect(loaded[0].id).toBe("c1");

    // Update and save again
    const updated: Conversation = { ...conv, title: "Updated" };
    saveConversation(updated);
    expect(loadConversations()[0].title).toBe("Updated");

    clearConversation("c1");
    expect(loadConversations()).toEqual([]);
  });
});
