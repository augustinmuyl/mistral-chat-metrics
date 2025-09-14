"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Topbar from "@/components/Topbar";
import MessageList from "@/components/MessageList";
import ChatComposer from "@/components/ChatComposer";
import SidebarMetrics from "@/components/SidebarMetrics";
import EmptyState from "@/components/EmptyState";
import type { Message } from "@/lib/schemas";
import { streamChat, type StreamController } from "@/lib/streaming";
import {
  accumulateResponseBytes,
  bytesToKB,
  byteLengthOfString,
  computeDurationMs,
  computeLatencyMs,
  jsonByteLength,
} from "@/lib/metrics";
import { saveConversation, loadConversations } from "@/lib/storage";

function newId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentModel, setCurrentModel] = useState("mistral-large-latest");
  const [currentPreset, setCurrentPreset] = useState("general");
  const [isStreaming, setIsStreaming] = useState(false);
  const [mockEnabled, setMockEnabled] = useState<boolean | undefined>(undefined);

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

  // Restore last conversation title or ignore for V1
  useEffect(() => {
    loadConversations();
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
            byteLengthOfString(delta.content),
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
          const t =
            (final.usage?.prompt ?? 0) + (final.usage?.completion ?? 0);
          if (t > 0) setTokens(t);
          setIsStreaming(false);

          // Persist conversation
          const title = nextMessages[0]?.content?.slice(0, 60) || "Conversation";
          const convo = {
            id: convIdRef.current,
            title,
            messages: [
              ...nextMessages,
              { id: assistantId, role: "assistant", content: assistantContentRef.current },
            ].map(({ id, role, content }) => ({ id, role, content })),
            model: currentModel,
            preset: currentPreset,
          };
          saveConversation(convo);
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

  const onClearHistory = useCallback(() => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem("mistral.chat.conversations");
      } catch { }
    }
  }, []);

  const hasMessages = messages.length > 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Topbar
        model={currentModel}
        onModelChange={setCurrentModel}
        preset={currentPreset}
        onPresetChange={setCurrentPreset}
        mockEnabled={mockEnabled}
        onClearHistory={onClearHistory}
      />
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_20rem] max-w-5xl mx-auto w-full gap-0">
        <main className="px-4 py-4 flex flex-col gap-4 min-h-0">
          <div className="flex-1 min-h-0 overflow-y-auto pr-1">
            {hasMessages ? (
              <MessageList messages={messages} />
            ) : (
              <EmptyState />
            )}
          </div>
          <ChatComposer disabled={isStreaming} onSend={onSend} onStop={onStop} />
        </main>
        <SidebarMetrics
          latencyMs={latencyMs}
          durationMs={durationMs}
          reqKB={reqKB}
          respKB={respKB}
          model={currentModel}
          preset={currentPreset}
          tokens={tokens}
        />
      </div>
    </div>
  );
}
