"use client";

import { AllModelNames } from "@/agent/lib";
import { ArtifactRenderer } from "@/components/artifacts/ArtifactRenderer";
import { ContentComposerChatInterface } from "@/components/ContentComposer";
import { useToast } from "@/hooks/use-toast";
import { useGraph } from "@/hooks/useGraph";
import { useStore } from "@/hooks/useStore";
import { useThread } from "@/hooks/useThread";
import { getLanguageTemplate } from "@/lib/get_language_template";
import { cn } from "@/lib/utils";
import { Artifact, ProgrammingLanguageOptions } from "@/types";
import { User } from "@supabase/supabase-js";
import { useState } from "react";
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
    model,
    setModel,
  } = useThread(props.user.id);
  const [chatStarted, setChatStarted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const {
    streamMessage,
    setMessages,
    setArtifact,
    messages,
    setSelectedArtifact,
    setArtifactContent,
    clearState,
    switchSelectedThread,
    artifact,
  } = useGraph({
    threadId,
    assistantId,
    userId: props.user.id,
    model: model,
  });
  const {
    reflections,
    deleteReflections,
    getReflections,
    isLoadingReflections,
  } = useStore(assistantId);

  const createThreadWithChatStarted = async (
    modelName: AllModelNames = model
  ) => {
    setChatStarted(false);
    clearState();
    return createThread(modelName);
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
    const newArtifact: Artifact = {
      id: artifactId,
      currentContentIndex: 1,
      contents: [
        {
          index: 1,
          title: `Quickstart ${type}`,
          content:
            type === "code"
              ? getLanguageTemplate(language ?? "javascript")
              : "# Hello world",
          type,
          language: language ?? "english",
        },
      ],
    };
    // Do not worry about existing items in state. This should
    // never occur since this action can only be invoked if
    // there are no messages/artifacts in the thread.
    setArtifact(newArtifact);
    setIsEditing(true);
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
          userId={props.user.id}
          getUserThreads={getUserThreads}
          isUserThreadsLoading={isUserThreadsLoading}
          userThreads={userThreads}
          switchSelectedThread={(thread) => {
            switchSelectedThread(thread, setThreadId);
            // Chat should only be "started" if there are messages present
            if ((thread.values as Record<string, any>)?.messages?.length) {
              setChatStarted(true);
              setModel(thread?.metadata?.model as AllModelNames);
            } else {
              setChatStarted(false);
            }
          }}
          deleteThread={(id) => deleteThread(id, () => setMessages([]))}
          handleGetReflections={getReflections}
          handleDeleteReflections={deleteReflections}
          reflections={reflections}
          isLoadingReflections={isLoadingReflections}
          streamMessage={streamMessage}
          messages={messages}
          setMessages={setMessages}
          createThread={createThreadWithChatStarted}
          setChatStarted={setChatStarted}
          showNewThreadButton={chatStarted}
          handleQuickStart={handleQuickStart}
          setModel={setModel}
          model={model}
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
            setSelectedArtifact={setSelectedArtifact}
            messages={messages}
            setMessages={setMessages}
            artifact={artifact}
            streamMessage={streamMessage}
          />
        </div>
      )}
    </main>
  );
}
