"use client";
import { ArtifactRenderer } from "@/components/artifacts/ArtifactRenderer";
import { ContentComposerChatInterface } from "@/components/ContentComposer";
import { useGraph } from "@/hooks/useGraph";
import { cn } from "@/lib/utils";
import { useState } from "react";

export default function Home() {
  const [chatStarted, setChatStarted] = useState(false);
  const {
    streamMessage,
    setMessages,
    setArtifacts,
    artifacts,
    messages,
    setSelectedArtifact,
    selectedArtifactId,
    createThread,
  } = useGraph();

  const createThreadWithChatStarted = async () => {
    setChatStarted(false);
    return createThread();
  };

  return (
    <main className="h-screen flex flex-row">
      <div
        className={cn(
          "transition-all duration-700",
          chatStarted ? "w-[35%]" : "w-full",
          "h-full mr-auto bg-gray-50/70 shadow-inner-right"
        )}
      >
        <ContentComposerChatInterface
          setSelectedArtifact={setSelectedArtifact}
          streamMessage={streamMessage}
          setArtifacts={setArtifacts}
          messages={messages}
          setMessages={setMessages}
          createThread={createThreadWithChatStarted}
          setChatStarted={setChatStarted}
        />
      </div>
      {chatStarted && (
        <div className="w-full ml-auto">
          <ArtifactRenderer
            setSelectedArtifactById={setSelectedArtifact}
            messages={messages}
            setMessages={setMessages}
            artifact={
              selectedArtifactId
                ? artifacts.find((a) => a.id === selectedArtifactId)
                : undefined
            }
            streamMessage={streamMessage}
          />
        </div>
      )}
    </main>
  );
}
