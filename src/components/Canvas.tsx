"use client";

import { ArtifactRenderer } from "@/components/artifacts/ArtifactRenderer";
import { ContentComposerChatInterface } from "@/components/ContentComposer";
import { ALL_MODEL_NAMES } from "@/constants";
import { useGraph } from "@/hooks/use-graph/useGraph";
import { useToast } from "@/hooks/use-toast";
import { useThread } from "@/hooks/useThread";
import { getLanguageTemplate } from "@/lib/get_language_template";
import { cn } from "@/lib/utils";
import {
  ArtifactCodeV3,
  ArtifactMarkdownV3,
  ArtifactV3,
  ProgrammingLanguageOptions,
} from "@/types";
import { useEffect, useState } from "react";

export function Canvas() {
  const { toast } = useToast();
  const {
    threadId,
    assistantId,
    searchOrCreateThread,
    getOrCreateAssistant,
    clearThreadsWithNoValues,
    setModelName,
  } = useThread();
  const [chatStarted, setChatStarted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { setArtifact } = useGraph();

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!threadId) {
      searchOrCreateThread();
    }

    if (!assistantId) {
      getOrCreateAssistant();
    }
  }, []);

  useEffect(() => {
    if (!threadId) return;
    // Clear threads with no values
    clearThreadsWithNoValues();
  }, [threadId]);

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

    let artifactContent: ArtifactCodeV3 | ArtifactMarkdownV3;
    if (type === "code" && language) {
      artifactContent = {
        index: 1,
        type: "code",
        title: `Quick start ${type}`,
        code: getLanguageTemplate(language),
        language,
      };
    } else {
      artifactContent = {
        index: 1,
        type: "text",
        title: `Quick start ${type}`,
        fullMarkdown: "",
      };
    }

    const newArtifact: ArtifactV3 = {
      currentIndex: 1,
      contents: [artifactContent],
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
          switchSelectedThreadCallback={(thread) => {
            // Chat should only be "started" if there are messages present
            if ((thread.values as Record<string, any>)?.messages?.length) {
              setChatStarted(true);
              setModelName(
                thread?.metadata?.customModelName as ALL_MODEL_NAMES
              );
            } else {
              setChatStarted(false);
            }
          }}
          setChatStarted={setChatStarted}
          hasChatStarted={chatStarted}
          handleQuickStart={handleQuickStart}
        />
      </div>
      {chatStarted && (
        <div className="w-full ml-auto">
          <ArtifactRenderer setIsEditing={setIsEditing} isEditing={isEditing} />
        </div>
      )}
    </main>
  );
}
