export type Conversation = {
  id: string;
  title?: string;
  messages: Array<{
    id: string;
    role: "system" | "user" | "assistant";
    content: string;
  }>;
  model?: string;
  preset?: string;
};

const KEY = "mistral.chat.conversations";

function canUseStorage() {
  return typeof window !== "undefined" && !!window.localStorage;
}

export function saveConversation(conv: Conversation) {
  if (!canUseStorage()) return;
  const list = loadConversations();
  const idx = list.findIndex((c) => c.id === conv.id);
  if (idx >= 0) list[idx] = conv;
  else list.unshift(conv);
  window.localStorage.setItem(KEY, JSON.stringify(list));
}

export function loadConversations(): Conversation[] {
  if (!canUseStorage()) return [];
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function clearConversation(id: string) {
  if (!canUseStorage()) return;
  const list = loadConversations().filter((c) => c.id !== id);
  window.localStorage.setItem(KEY, JSON.stringify(list));
}
