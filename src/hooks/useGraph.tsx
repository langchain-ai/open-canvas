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

  const streamMessagev2 = async (params: GraphInput) => {
    if (!threadId) {
      toast({
        title: "Error",
        description: "Thread ID not found",
      });
      return undefined;
    }

    const client = createClient();
    const input = { ...params };
    return client.runs.stream(threadId, "agent", {
      input,
      streamMode: "events",
    });
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
    const input = { ...params };
    const stream = client.runs.stream(threadId, "agent", {
      input,
      streamMode: "events",
    });

    let fullArtifactGenerationStr = "";
    let artifactId = "";
    let updatingArtifactId = "";
    let newArtifactText = "";
    let originalArtifactContent = "";
    let updatedContent = "";

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
                    content: artifact.artifact.replaceAll("\n", realNewline),
                  },
                ];
              });
            }
          } catch (e) {
            // no-op
          }
        } else if (chunk.data.metadata.langgraph_node === "updateArtifact") {
          newArtifactText += chunk.data.data.chunk[1].content;

          if (params.highlighted) {
            // instead of re-writing the whole artifact, just replace the updated content
          }

          if (updatingArtifactId) {
            setArtifacts((prev) => {
              return prev.map((artifact) => {
                if (artifact.id === updatingArtifactId) {
                  return {
                    ...artifact,
                    content: newArtifactText.replaceAll("\n", realNewline),
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
