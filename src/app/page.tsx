"use client";
import { ArtifactRenderer } from "@/components/ArtifactRenderer";
import { ContentComposerChatInterface } from "@/components/ContentComposer";
import { useGraph } from "@/hooks/useGraph";

export default function Home() {
  const { streamMessage, setMessages, messages } = useGraph();
  let recentAIMessage = messages.findLast((msg) => msg._getType() === "ai");

  return (
    <main className="h-screen flex flex-row">
      <div className="w-[25%] h-full mr-auto bg-gray-50/70 shadow-inner-right">
        <ContentComposerChatInterface
          streamMessage={streamMessage}
          messages={messages}
          setMessages={setMessages}
        />
      </div>
      <div className="w-full ml-auto">
        <ArtifactRenderer
          content={(recentAIMessage?.content as string | undefined) ?? ""}
        />
      </div>
    </main>
  );
}
