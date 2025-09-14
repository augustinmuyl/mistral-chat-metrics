import { useState } from "react";

type Props = {
  disabled?: boolean;
  onSend?: (text: string) => void;
  onStop?: () => void;
};

export default function ChatComposer({ disabled, onSend, onStop }: Props) {
  const [text, setText] = useState("");

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (text.trim().length > 0) {
        onSend?.(text);
        setText("");
      }
    }
  }

  return (
    <div className="w-full flex items-end gap-2">
      <textarea
        className="w-full border rounded px-3 py-2 min-h-[80px]"
        placeholder="Type a message…"
        aria-label="Chat input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={!!disabled}
      />
      {disabled ? (
        <button
          className="border rounded px-3 py-2 text-sm"
          onClick={() => onStop?.()}
          aria-label="Stop streaming"
        >
          Stop
        </button>
      ) : (
        <button
          className="border rounded px-3 py-2 text-sm"
          onClick={() => {
            if (text.trim().length > 0) {
              onSend?.(text);
              setText("");
            }
          }}
          aria-label="Send message"
        >
          Send
        </button>
      )}
    </div>
  );
}
