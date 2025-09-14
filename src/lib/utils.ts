import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function deriveTitle(text: string, maxLen = 60): string {
  try {
    if (!text) return "";
    let s = String(text);
    // Remove fenced code blocks and inline code
    s = s.replace(/```[\s\S]*?```/g, " ");
    s = s.replace(/`[^`]*`/g, " ");
    // Collapse links: [label](url) -> label
    s = s.replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1");
    // Strip markdown emphasis markers
    s = s.replace(/[*_~#>]+/g, " ");
    // Collapse whitespace and newlines
    s = s.replace(/\s+/g, " ").trim();
    // Prefer first sentence if reasonably short
    const sentenceMatch = s.match(/^(.*?[.!?])\s/);
    let candidate = sentenceMatch ? sentenceMatch[1] : s;
    candidate = candidate.trim();
    if (candidate.length > maxLen) {
      candidate = candidate.slice(0, maxLen - 1).trimEnd() + "…";
    }
    // Avoid empty title
    if (!candidate) return "Conversation";
    return candidate;
  } catch {
    return "Conversation";
  }
}
