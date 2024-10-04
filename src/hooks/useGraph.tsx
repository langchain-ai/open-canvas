import { useEffect, useState } from "react";
import { AIMessage, BaseMessage } from "@langchain/core/messages";
import { useToast } from "./use-toast";
import { createClient } from "./utils";
import { Artifact, Highlight } from "@/types";
import { parsePartialJson } from "@langchain/core/output_parsers";

export interface GraphInput {
  messages: Record<string, any>[];
  highlighted?: Highlight;
}

const realNewline = `
`;

const cleanContent = (content: string): string => {
  return content.replaceAll("\n", realNewline);
};

export function useGraph() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<BaseMessage[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [threadId, setThreadId] = useState<string | null>(null);

  useEffect(() => {
    if (threadId || typeof window === "undefined") return;
    createThread();
  }, []);

  const createThread = async () => {
    const client = createClient();
    const thread = await client.threads.create();
    setThreadId(thread.thread_id);
    return thread;
  };

  const streamMessage = async (params: GraphInput) => {
    if (!threadId) {
      toast({
        title: "Error",
        description: "Thread ID not found",
      });
      return undefined;
    }

    const client = createClient();
    const input = {
      // Ensure we remove this from the state, unless it's included in the params.
      highlighted: undefined,
      ...params,
    };
    const stream = client.runs.stream(threadId, "agent", {
      input,
      streamMode: "events",
    });

    let fullArtifactGenerationStr = "";
    let artifactId = "";
    let updatingArtifactId = "";
    let newArtifactText = "";

    // All the text up until the startCharIndex
    let updatedArtifactStartContent: string | undefined = undefined;
    // All the text after the endCharIndex
    let updatedArtifactRestContent: string | undefined = undefined;

    for await (const chunk of stream) {
      if (chunk.data.event === "on_chat_model_stream") {
        if (chunk.data.metadata.langgraph_node === "generateArtifact") {
          if (!artifactId && chunk.data.data.chunk[1].id) {
            artifactId = chunk.data.data.chunk[1].id;
          }
          fullArtifactGenerationStr +=
            chunk.data.data.chunk?.[1]?.tool_call_chunks?.[0]?.args;
          try {
            const artifact = parsePartialJson(fullArtifactGenerationStr);
            if (artifact.artifact && artifactId) {
              setArtifacts((prev) => {
                const allWithoutCurrent = prev.filter(
                  (a) => a.id !== artifactId
                );
                return [
                  ...allWithoutCurrent,
                  {
                    id: artifactId,
                    title: artifact.title ?? "",
                    content: cleanContent(artifact.artifact),
                  },
                ];
              });
            }
          } catch (e) {
            // no-op
          }
        } else if (chunk.data.metadata.langgraph_node === "updateArtifact") {
          if (params.highlighted && updatingArtifactId) {
            const partialUpdatedContent = chunk.data.data.chunk[1].content;
            const { startCharIndex, endCharIndex } = params.highlighted;

            if (
              updatedArtifactStartContent === undefined &&
              updatedArtifactRestContent === undefined
            ) {
              const originalArtifact = artifacts.find(
                (a) => a.id === updatingArtifactId
              );
              if (!originalArtifact) {
                toast({
                  title: "Error",
                  description: "Original artifact not found",
                });
                return;
              }
              updatedArtifactStartContent = originalArtifact.content.slice(
                0,
                startCharIndex
              );
              updatedArtifactRestContent =
                originalArtifact.content.slice(endCharIndex);
              console.log({
                original: originalArtifact.content,
                updatedArtifactStartContent,
                updatedArtifactRestContent,
              });
            } else {
              // One of the above have been populated, now we can update the start to contain the new text.
              updatedArtifactStartContent += partialUpdatedContent;
            }

            setArtifacts((prev) =>
              prev.map((artifact) => {
                if (artifact.id === updatingArtifactId) {
                  return {
                    ...artifact,
                    content: cleanContent(
                      `${updatedArtifactStartContent}${updatedArtifactRestContent}`
                    ),
                  };
                }
                return artifact;
              })
            );
          } else if (updatingArtifactId) {
            newArtifactText += chunk.data.data.chunk[1].content;

            // If no highlight, update the entire content as before
            setArtifacts((prev) => {
              return prev.map((artifact) => {
                if (artifact.id === updatingArtifactId) {
                  return {
                    ...artifact,
                    content: cleanContent(newArtifactText),
                  };
                }
                return artifact;
              });
            });
          }
        } else if (chunk.data.metadata.langgraph_node === "generateFollowup") {
          const message = chunk.data.data.chunk[1];
          setMessages((prevMessages) => {
            const existingMessageIndex = prevMessages.findIndex(
              (msg) => msg.id === message.id
            );
            if (existingMessageIndex !== -1) {
              // Create a new array with the updated message
              return [
                ...prevMessages.slice(0, existingMessageIndex),
                new AIMessage({
                  ...prevMessages[existingMessageIndex],
                  content:
                    prevMessages[existingMessageIndex].content +
                    message.content,
                }),
                ...prevMessages.slice(existingMessageIndex + 1),
              ];
            } else {
              const newMessage = new AIMessage({
                ...message,
              });
              return [...prevMessages, newMessage];
            }
          });
        } else if (chunk.data.metadata.langgraph_node === "respondToQuery") {
          const message = chunk.data.data.chunk[1];
          setMessages((prevMessages) => {
            const existingMessageIndex = prevMessages.findIndex(
              (msg) => msg.id === message.id
            );
            if (existingMessageIndex !== -1) {
              // Create a new array with the updated message
              return [
                ...prevMessages.slice(0, existingMessageIndex),
                new AIMessage({
                  ...prevMessages[existingMessageIndex],
                  content:
                    prevMessages[existingMessageIndex].content +
                    message.content,
                }),
                ...prevMessages.slice(existingMessageIndex + 1),
              ];
            } else {
              const newMessage = new AIMessage({
                ...message,
              });
              return [...prevMessages, newMessage];
            }
          });
        }
      } else if (chunk.data.event === "on_chain_start") {
        if (chunk.data.metadata.langgraph_node === "updateArtifact") {
          if (
            chunk.data.data?.input?.selectedArtifactId &&
            !updatingArtifactId
          ) {
            updatingArtifactId = chunk.data.data?.input?.selectedArtifactId;
          }
        }
      }
    }
  };

  return {
    artifacts,
    messages,
    setArtifacts,
    setMessages,
    streamMessage,
  };
}
