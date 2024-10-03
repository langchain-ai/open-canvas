"use client";
import { ContentComposerChatInterface } from "@/components/ContentComposer";
import { useGraph } from "@/hooks/useGraph";

export default function Home() {
  const { streamMessage, setMessages, messages } = useGraph();

  return (
    <main className="h-screen">
      <ContentComposerChatInterface
        streamMessage={streamMessage}
        messages={messages}
        setMessages={setMessages}
      />
    </main>
  );
}
