import { useCallback, useEffect, useRef, useState } from "react";
import type { Message } from "@/lib/schemas";
import { streamChat, type StreamController } from "@/lib/streaming";
import {
  accumulateResponseBytes,
  bytesToKB,
  computeDurationMs,
  computeLatencyMs,
  jsonByteLength,
} from "@/lib/metrics";
import { deriveTitle } from "@/lib/utils";
import {
  saveConversation,
  loadConversations,
  clearConversation,
} from "@/lib/storage";
import type { Conversation } from "@/lib/storage";

function newId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useChatController() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentModel, setCurrentModel] = useState("mistral-small-latest");
  const [currentPreset, setCurrentPreset] = useState("general");
  const [isStreaming, setIsStreaming] = useState(false);
  const [mockEnabled, setMockEnabled] = useState<boolean | undefined>(
    undefined,
  );

  const [latencyMs, setLatencyMs] = useState<number | undefined>();
  const [durationMs, setDurationMs] = useState<number | undefined>();
  const [reqKB, setReqKB] = useState<number | undefined>();
  const [respKB, setRespKB] = useState<number | undefined>();
  const [tokens, setTokens] = useState<number | undefined>();

  const [conversationList, setConversationList] = useState<Conversation[]>([]);

  const streamRef = useRef<StreamController | null>(null);
  const t0Ref = useRef<number>(0);
  const firstDeltaAtRef = useRef<number | null>(null);
  const responseBytesRef = useRef<number>(0);
  const convIdRef = useRef<string>(newId());
  const assistantContentRef = useRef<string>("");

  // On load: populate conversations list but start on an empty screen
  useEffect(() => {
    try {
      const list = loadConversations();
      setConversationList(Array.isArray(list) ? list : []);
      // Do not auto-open a conversation; keep defaults and empty messages
    } catch {}
  }, []);

  const onStop = useCallback(() => {
    streamRef.current?.abort();
    setIsStreaming(false);
  }, []);

  // Escape to stop streaming
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && isStreaming) {
        onStop();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isStreaming, onStop]);

  const onSend = useCallback(
    (text: string) => {
      if (isStreaming) return;
      const userMsg: Message = {
        id: newId(),
        role: "user",
        content: text,
        model: currentModel,
        preset: currentPreset,
      };
      const nextMessages: Message[] = [...messages, userMsg];
      setMessages(nextMessages);

      // Begin streaming
      setIsStreaming(true);
      t0Ref.current = Date.now();
      firstDeltaAtRef.current = null;
      responseBytesRef.current = 0;
      setLatencyMs(undefined);
      setDurationMs(undefined);
      setTokens(undefined);

      const body = {
        model: currentModel,
        messages: nextMessages,
        stream: true,
        preset: currentPreset,
      };
      setReqKB(bytesToKB(jsonByteLength(body)));

      const assistantId = newId();
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "" },
      ]);
      assistantContentRef.current = "";

      const controller = streamChat(body, {
        onMeta: (meta) => {
          setMockEnabled(meta.mock);
          // Prefer server t0, but use local if missing
          t0Ref.current = meta.t0 || t0Ref.current;
        },
        onDelta: (delta) => {
          const now = Date.now();
          if (firstDeltaAtRef.current == null) {
            firstDeltaAtRef.current = now;
            setLatencyMs(computeLatencyMs(t0Ref.current, now));
          }
          responseBytesRef.current = accumulateResponseBytes(
            responseBytesRef.current,
            delta.content,
          );
          setRespKB(bytesToKB(responseBytesRef.current));
          assistantContentRef.current += delta.content;
          setMessages((prev) => {
            return prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: m.content + delta.content }
                : m,
            );
          });
        },
        onFinal: (final) => {
          const now = Date.now();
          setDurationMs(computeDurationMs(t0Ref.current, now));
          const t = (final.usage?.prompt ?? 0) + (final.usage?.completion ?? 0);
          if (t > 0) setTokens(t);
          setIsStreaming(false);

          // Persist conversation
          const title =
            deriveTitle(nextMessages[0]?.content || "", 60) || "Conversation";
          const mappedPrev: Conversation["messages"] = nextMessages.map(
            ({ id, role, content }: Message) => ({ id, role, content }),
          ) as Conversation["messages"];
          const convo: Conversation = {
            id: convIdRef.current,
            title,
            messages: [
              ...mappedPrev,
              {
                id: assistantId,
                role: "assistant",
                content: assistantContentRef.current,
              },
            ],
            model: currentModel,
            preset: currentPreset,
          };
          saveConversation(convo);
          try {
            const updated = loadConversations();
            setConversationList(Array.isArray(updated) ? updated : []);
          } catch {}
        },
        onError: () => {
          setIsStreaming(false);
        },
        onClose: () => {
          // no-op
        },
      });
      streamRef.current = controller;
    },
    [currentModel, currentPreset, isStreaming, messages],
  );

  const onNewChat = useCallback(() => {
    if (isStreaming) onStop();
    setMessages([]);
    setLatencyMs(undefined);
    setDurationMs(undefined);
    setReqKB(undefined);
    setRespKB(undefined);
    setTokens(undefined);
    assistantContentRef.current = "";
    convIdRef.current = newId();
  }, [isStreaming, onStop]);

  const onSelectConversation = useCallback(
    (id: string) => {
      if (isStreaming) onStop();
      try {
        const list = loadConversations();
        setConversationList(Array.isArray(list) ? list : []);
        const target = Array.isArray(list)
          ? list.find((c) => c.id === id)
          : null;
        if (!target) return;
        convIdRef.current = target.id;
        if (target.model) setCurrentModel(target.model);
        if (target.preset) setCurrentPreset(target.preset);
        if (Array.isArray(target.messages)) {
          setMessages(
            target.messages.map((m) => ({
              id: m.id,
              role: m.role,
              content: m.content,
            })) as Message[],
          );
        } else {
          setMessages([]);
        }
        setLatencyMs(undefined);
        setDurationMs(undefined);
        setReqKB(undefined);
        setRespKB(undefined);
        setTokens(undefined);
        assistantContentRef.current = "";
      } catch {}
    },
    [isStreaming, onStop],
  );

  const onDeleteConversation = useCallback(() => {
    try {
      const currentId = convIdRef.current;
      if (!currentId) return;
      clearConversation(currentId);
      const list = loadConversations();
      setConversationList(Array.isArray(list) ? list : []);
    } catch {}
    setMessages([]);
    setLatencyMs(undefined);
    setDurationMs(undefined);
    setReqKB(undefined);
    setRespKB(undefined);
    setTokens(undefined);
    assistantContentRef.current = "";
    convIdRef.current = newId();
  }, []);

  const onExportConversation = useCallback(() => {
    try {
      const existing = conversationList.find((c) => c.id === convIdRef.current);
      const convo = existing
        ? existing
        : {
            id: convIdRef.current,
            title:
              deriveTitle(messages[0]?.content || "", 60) || "Conversation",
            messages: messages.map(({ id, role, content }: Message) => ({
              id,
              role,
              content,
            })) as Conversation["messages"],
            model: currentModel,
            preset: currentPreset,
          };

      const blob = new Blob([JSON.stringify(convo, null, 2)], {
        type: "application/json;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `conversation-${convo.id}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {}
  }, [conversationList, currentModel, currentPreset, messages]);

  return {
    // state
    messages,
    setMessages,
    currentModel,
    setCurrentModel,
    currentPreset,
    setCurrentPreset,
    isStreaming,
    mockEnabled,
    // metrics
    latencyMs,
    durationMs,
    reqKB,
    respKB,
    tokens,
    // conversations
    conversationList,
    currentConversationId: convIdRef.current,
    // actions
    onSend,
    onStop,
    onNewChat,
    onSelectConversation,
    onDeleteConversation,
    onExportConversation,
  } as const;
}
