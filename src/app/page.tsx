"use client";
import { ArtifactRenderer } from "@/components/artifacts/ArtifactRenderer";
import { ContentComposerChatInterface } from "@/components/ContentComposer";
import { useToast } from "@/hooks/use-toast";
import { useGraph } from "@/hooks/useGraph";
import { getLanguageTemplate } from "@/lib/get_language_template";
import { cn } from "@/lib/utils";
import { ProgrammingLanguageOptions } from "@/types";
import { AIMessage } from "@langchain/core/messages";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";

export default function Home() {
  const { toast } = useToast();
  const [chatStarted, setChatStarted] = useState(false);
  const [pendingArtifactSelection, setPendingArtifactSelection] = useState<
    string | null
  >(null);
  const {
    streamMessage,
    setMessages,
    setArtifacts,
    artifacts,
    messages,
    setSelectedArtifact,
    selectedArtifactId,
    createThread,
    setArtifactContent,
  } = useGraph();

  const createThreadWithChatStarted = async () => {
    setChatStarted(false);
    return createThread();
  };

  const handleQuickStart = (
    type: "text" | "code",
    language?: ProgrammingLanguageOptions
  ) => {
    if (type === "code" && !language) {
      toast({
        title: "Language not selected",
        description: "Please select a language to continue",
        duration: 5000,
      });
      return;
    }
    setChatStarted(true);

    const artifactId = uuidv4();
    const artifact = {
      id: artifactId,
      title: `Quickstart ${type}`,
      content: getLanguageTemplate(language ?? "javascript"),
      type,
      language: language ?? "english",
    };
    setArtifacts((prevArtifacts) => [...prevArtifacts, artifact]);
    setMessages((prevMessages) => {
      const newMessage = new AIMessage({
        content: "",
        tool_calls: [
          {
            id: artifactId,
            args: { title: artifact.title },
            name: "artifact_ui",
          },
        ],
      });
      return [...prevMessages, newMessage];
    });
    setPendingArtifactSelection(artifactId);
  };

  useEffect(() => {
    if (pendingArtifactSelection) {
      setSelectedArtifact(pendingArtifactSelection);
      setPendingArtifactSelection(null);
    }
  }, [artifacts, pendingArtifactSelection, setSelectedArtifact]);

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
          showNewThreadButton={chatStarted}
          handleQuickStart={handleQuickStart}
        />
      </div>
      {chatStarted && (
        <div className="w-full ml-auto">
          <ArtifactRenderer
            setArtifactContent={setArtifactContent}
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
