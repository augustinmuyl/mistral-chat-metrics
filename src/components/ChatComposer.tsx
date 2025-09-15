import { useState } from "react";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { ArrowBigUp, Send, Square } from "lucide-react";

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
    <div className="w-full">
      <div className="relative w-full">
        <Textarea
          placeholder="Type a message…"
          aria-label="Chat input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={!!disabled}
          className="max-h-64 md:max-h-80 overflow-auto resize-y pr-24"
        />
        {disabled ? (
          <Button
            onClick={() => onStop?.()}
            variant="outline"
            aria-label="Stop streaming"
            className="absolute bottom-2 right-2"
            size="icon"
          >
            <Square />
          </Button>
        ) : (
          <Button
            variant="outline"
            size="icon"
            className="absolute bottom-2 right-2"
            onClick={() => {
              if (text.trim().length > 0) {
                onSend?.(text);
                setText("");
              }
            }}
            aria-label="Send message"
          >
            <ArrowBigUp />
          </Button>
        )}
      </div>
    </div>
  );
}
