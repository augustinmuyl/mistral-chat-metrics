import Image from "next/image";

export default function EmptyState() {
  return (
    <div className="text-center opacity-90">
      <div className="flex items-center justify-center">
        <Image
          src="/mistral_logo.png"
          alt="Mistral warm gradient hero"
          width={200}
          height={0}
          priority
          className="mx-auto h-auto w-auto max-w-1/4"
        />
      </div>
      <div className="text-lg mt-6">Start a new conversation</div>
      <div className="text-sm mt-2">
        Shift+Enter for newline. Enter to send.
      </div>
    </div>
  );
}
