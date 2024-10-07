"use client";
import { ArtifactRenderer } from "@/components/artifacts/ArtifactRenderer";
import { ContentComposerChatInterface } from "@/components/ContentComposer";
import { useGraph } from "@/hooks/useGraph";

export default function Home() {
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

  return (
    <main className="h-screen flex flex-row">
      <div className="w-[35%] h-full mr-auto bg-gray-50/70 shadow-inner-right">
        <ContentComposerChatInterface
          setSelectedArtifact={setSelectedArtifact}
          streamMessage={streamMessage}
          setArtifacts={setArtifacts}
          messages={messages}
          setMessages={setMessages}
          createThread={createThread}
        />
      </div>
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
    </main>
  );
}
