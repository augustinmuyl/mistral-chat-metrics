import React from "react";
import ReactMarkdown from "react-markdown";

export type ChatMessage = {
  id: string;
  role: "system" | "user" | "assistant";
  content: string;
};

type Props = {
  messages: ChatMessage[];
};

export default function MessageList({ messages }: Props) {
  return (
    <div className="flex flex-col gap-3" aria-live="polite">
      {messages.map((m) => (
        <div
          key={m.id}
          className={
            m.role === "user"
              ? "self-end bg-gray-100 dark:bg-gray-800 rounded px-3 py-2"
              : "self-start bg-white/60 dark:bg-white/5 rounded px-3 py-2"
          }
        >
          <div className="text-xs opacity-60 mb-1">{m.role}</div>
          {m.role === "assistant" ? (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown>{m.content}</ReactMarkdown>
            </div>
          ) : (
            <div className="whitespace-pre-wrap">{m.content}</div>
          )}
        </div>
      ))}
    </div>
  );
}
