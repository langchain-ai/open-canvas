"use client";

import { ArtifactRenderer } from "@/components/artifacts/ArtifactRenderer";
import { ContentComposerChatInterface } from "@/components/ContentComposer";
import { useToast } from "@/hooks/use-toast";
import { useGraph } from "@/hooks/useGraph";
import { useStore } from "@/hooks/useStore";
import { useThread } from "@/hooks/useThread";
import { getLanguageTemplate } from "@/lib/get_language_template";
import { cn } from "@/lib/utils";
import { ProgrammingLanguageOptions } from "@/types";
import { AIMessage } from "@langchain/core/messages";
import { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";

interface CanvasProps {
  user: User;
}

export function Canvas(props: CanvasProps) {
  const { toast } = useToast();
  const {
    threadId,
    assistantId,
    createThread,
    deleteThread,
    userThreads,
    isUserThreadsLoading,
    getUserThreads,
    setThreadId,
  } = useThread(props.user.id);
  const [chatStarted, setChatStarted] = useState(false);
  const [pendingArtifactSelection, setPendingArtifactSelection] = useState<
    string | null
  >(null);
  const [isEditing, setIsEditing] = useState(false);
  const {
    streamMessage,
    setMessages,
    setArtifacts,
    artifacts,
    messages,
    setSelectedArtifact,
    selectedArtifactId,
    setArtifactContent,
    clearState,
    switchSelectedThread,
  } = useGraph({ threadId, assistantId, userId: props.user.id });
  const {
    reflections,
    deleteReflections,
    getReflections,
    isLoadingReflections,
  } = useStore(assistantId);

  const createThreadWithChatStarted = async () => {
    setChatStarted(false);
    clearState();
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
      content:
        type === "code"
          ? getLanguageTemplate(language ?? "javascript")
          : "# Hello world",
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
    setIsEditing(true);
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
          userId={props.user.id}
          getUserThreads={getUserThreads}
          isUserThreadsLoading={isUserThreadsLoading}
          userThreads={userThreads}
          switchSelectedThread={(thread) => {
            switchSelectedThread(thread, setThreadId);
            // Chat should only be "started" if there are messages present
            if ((thread.values as Record<string, any>)?.messages?.length) {
              setChatStarted(true);
            } else {
              setChatStarted(false);
            }
          }}
          deleteThread={(id) => deleteThread(id, () => setMessages([]))}
          handleGetReflections={getReflections}
          handleDeleteReflections={deleteReflections}
          reflections={reflections}
          isLoadingReflections={isLoadingReflections}
          setSelectedArtifact={(id) => {
            if (selectedArtifactId === id) {
              setSelectedArtifact(undefined);
            } else {
              setSelectedArtifact(id);
            }
          }}
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
            handleGetReflections={getReflections}
            handleDeleteReflections={deleteReflections}
            reflections={reflections}
            isLoadingReflections={isLoadingReflections}
            setIsEditing={setIsEditing}
            isEditing={isEditing}
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
