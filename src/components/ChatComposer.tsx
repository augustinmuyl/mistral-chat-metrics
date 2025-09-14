import { useState } from "react";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";

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
    <div className="w-full flex items-center gap-2">
      <Textarea
        className="rounded-full py-[1.5%] pl-[3%]"
        placeholder="Type a message…"
        aria-label="Chat input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={!!disabled}
      />
      {disabled ? (
        <Button
          className="border rounded px-3 py-2 text-sm"
          onClick={() => onStop?.()}
          aria-label="Stop streaming"
        >
          Stop
        </Button>
      ) : (
        <Button
          variant="outline"
          className=""
          onClick={() => {
            if (text.trim().length > 0) {
              onSend?.(text);
              setText("");
            }
          }}
          aria-label="Send message"
        >
          Send
        </Button>
      )}
    </div>
  );
}
