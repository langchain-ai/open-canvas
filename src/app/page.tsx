"use client";
import { ArtifactRenderer } from "@/components/ArtifactRenderer";
import { ContentComposerChatInterface } from "@/components/ContentComposer";
import { useGraph } from "@/hooks/useGraph";

export default function Home() {
  const { streamMessage, setMessages, setArtifacts, artifacts, messages } =
    useGraph();
  let recentAIMessage = messages.findLast((msg) => msg._getType() === "ai");

  return (
    <main className="h-screen flex flex-row">
      <div className="w-[35%] h-full mr-auto bg-gray-50/70 shadow-inner-right">
        <ContentComposerChatInterface
          streamMessage={streamMessage}
          setArtifacts={setArtifacts}
          messages={messages}
          setMessages={setMessages}
        />
      </div>
      <div className="w-full ml-auto">
        <ArtifactRenderer
          messages={messages}
          setMessages={setMessages}
          artifact={artifacts[artifacts.length - 1]}
          streamMessage={streamMessage}
        />
      </div>
    </main>
  );
}
