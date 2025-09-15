"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import Topbar from "@/components/Topbar";
import MessageList from "@/components/MessageList";
import ChatComposer from "@/components/ChatComposer";
import SidebarMetrics from "@/components/SidebarMetrics";
import EmptyState from "@/components/EmptyState";
import { ScrollArea } from "@/components/ui/scroll-area";
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

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentModel, setCurrentModel] = useState("mistral-large-latest");
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

  const streamRef = useRef<StreamController | null>(null);
  const t0Ref = useRef<number>(0);
  const firstDeltaAtRef = useRef<number | null>(null);
  const responseBytesRef = useRef<number>(0);
  const convIdRef = useRef<string>(newId());
  const assistantContentRef = useRef<string>("");
  const [conversationList, setConversationList] = useState<Conversation[]>([]);

  // On load: populate conversations list but start on an empty screen
  useEffect(() => {
    try {
      const list = loadConversations();
      setConversationList(Array.isArray(list) ? list : []);
      // Do not auto-open a conversation; keep defaults and empty messages
    } catch { }
  }, []);

  const onStop = useCallback(() => {
    streamRef.current?.abort();
    setIsStreaming(false);
  }, []);

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
            // Pass the raw string so the helper can measure bytes
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
          const title = deriveTitle(nextMessages[0]?.content || "", 60) || "Conversation";
          const convo = {
            id: convIdRef.current,
            title,
            messages: [
              ...nextMessages,
              {
                id: assistantId,
                role: "assistant",
                content: assistantContentRef.current,
              },
            ].map(({ id, role, content }) => ({ id, role, content })),
            model: currentModel,
            preset: currentPreset,
          };
          saveConversation(convo);
          try {
            const updated = loadConversations();
            setConversationList(Array.isArray(updated) ? updated : []);
          } catch { }
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

  const onSelectConversation = useCallback((id: string) => {
    if (isStreaming) onStop();
    try {
      const list = loadConversations();
      setConversationList(Array.isArray(list) ? list : []);
      const target = Array.isArray(list) ? list.find((c) => c.id === id) : null;
      if (!target) return;
      convIdRef.current = target.id;
      if (target.model) setCurrentModel(target.model);
      if (target.preset) setCurrentPreset(target.preset);
      if (Array.isArray(target.messages)) {
        setMessages(
          target.messages.map((m) => ({ id: m.id, role: m.role, content: m.content })) as Message[],
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
    } catch { }
  }, [isStreaming, onStop]);

  const onDeleteConversation = useCallback(() => {
    try {
      const currentId = convIdRef.current;
      if (!currentId) return;
      // Remove from storage if it exists
      clearConversation(currentId);
      const list = loadConversations();
      setConversationList(Array.isArray(list) ? list : []);
    } catch {}
    // Reset to a brand-new empty chat
    setMessages([]);
    setLatencyMs(undefined);
    setDurationMs(undefined);
    setReqKB(undefined);
    setRespKB(undefined);
    setTokens(undefined);
    assistantContentRef.current = "";
    convIdRef.current = newId();
  }, []);

  const hasMessages = messages.length > 0;

  return (
    <div className="h-dvh overflow-hidden flex flex-col">
      <Topbar
        model={currentModel}
        onModelChange={setCurrentModel}
        preset={currentPreset}
        onPresetChange={setCurrentPreset}
        mockEnabled={mockEnabled}
        currentConversationId={convIdRef.current}
        conversations={conversationList}
        onSelectConversation={onSelectConversation}
        onNewChat={onNewChat}
        onDeleteConversation={onDeleteConversation}
      />
      {hasMessages ? (
        <motion.div
          className="flex-1 min-h-0 grid grid-cols-1 grid-rows-[1fr_auto] lg:grid-rows-1 lg:grid-cols-[1fr_20rem] max-w-5xl mx-auto w-full gap-0"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          <motion.main
            className="px-4 py-4 flex flex-col gap-4 min-h-0 max-h-screen"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <ScrollArea className="flex-1 min-h-0 pr-1">
              <MessageList messages={messages} />
            </ScrollArea>
            <ChatComposer
              disabled={isStreaming}
              onSend={onSend}
              onStop={onStop}
            />
          </motion.main>
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut", delay: 0.06 }}
          >
            <SidebarMetrics
              latencyMs={latencyMs}
              durationMs={durationMs}
              reqKB={reqKB}
              respKB={respKB}
              model={currentModel}
              preset={currentPreset}
              tokens={tokens}
            />
          </motion.div>
        </motion.div>
      ) : (
        // Initial load: only main components, centered with fade-ins
        <motion.div
          className="flex-1 flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
        >
          <div className="w-full max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: "easeOut", delay: 0.04 }}
            >
              <EmptyState />
            </motion.div>
            <motion.div
              className="mt-4"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut", delay: 0.12 }}
            >
              <ChatComposer
                disabled={isStreaming}
                onSend={onSend}
                onStop={onStop}
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
