import { useCallback, useState } from "react";
import { AIMessage, BaseMessage } from "@langchain/core/messages";
import { useToast } from "./use-toast";
import { createClient } from "./utils";
import {
  Artifact,
  ArtifactLengthOptions,
  Highlight,
  LanguageOptions,
  ProgrammingLanguageOptions,
  ReadingLevelOptions,
} from "@/types";
import { parsePartialJson } from "@langchain/core/output_parsers";
import { useRuns } from "./useRuns";
import { reverseCleanContent } from "@/lib/normalize_string";
import { Thread } from "@langchain/langgraph-sdk";
// import { DEFAULT_ARTIFACTS, DEFAULT_MESSAGES } from "@/lib/dummy";

interface ArtifactToolResponse {
  artifact?: string;
  title?: string;
  language?: string;
  type?: string;
}

export interface GraphInput {
  selectedArtifactId?: string;
  regenerateWithEmojis?: boolean;
  readingLevel?: ReadingLevelOptions;
  artifactLength?: ArtifactLengthOptions;
  language?: LanguageOptions;
  messages?: Record<string, any>[];
  highlighted?: Highlight;
  addComments?: boolean;
  addLogs?: boolean;
  portLanguage?: ProgrammingLanguageOptions;
  fixBugs?: boolean;
}

function removeCodeBlockFormatting(text: string): string {
  if (!text) return text;
  // Regular expression to match code blocks
  const codeBlockRegex = /^```[\w-]*\n([\s\S]*?)\n```$/;

  // Check if the text matches the code block pattern
  const match = text.match(codeBlockRegex);

  if (match) {
    // If it matches, return the content inside the code block
    return match[1].trim();
  } else {
    // If it doesn't match, return the original text
    return text;
  }
}

interface UseGraphInput {
  userId: string;
  threadId: string | undefined;
  assistantId: string | undefined;
}

export function useGraph(useGraphInput: UseGraphInput) {
  const { toast } = useToast();
  const { shareRun } = useRuns();
  const [messages, setMessages] = useState<BaseMessage[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  // Default to the last artifact in the list
  const [selectedArtifactId, setSelectedArtifactId] = useState<
    string | undefined
  >();

  const clearState = () => {
    setMessages([]);
    setArtifacts([]);
    setSelectedArtifactId(undefined);
  };

  const streamMessage = async (params: GraphInput) => {
    if (!useGraphInput.threadId) {
      toast({
        title: "Error",
        description: "Thread ID not found",
      });
      return undefined;
    }
    if (!useGraphInput.assistantId) {
      toast({
        title: "Error",
        description: "Assistant ID not found",
      });
      return undefined;
    }

    const client = createClient();

    const input = {
      // Ensure we set all existing values (except `artifacts` and `messages`) to undefined by default.
      selectedArtifactId,
      artifacts,
      messages: params.messages?.filter((msg) => {
        if (msg.role !== "assistant") {
          return true;
        }
        const aiMsg = msg as AIMessage;
        // Filter our artifact ui tool calls from going to the server.
        if (
          aiMsg.tool_calls &&
          aiMsg.tool_calls.some((tc) => tc.name === "artifact_ui")
        ) {
          return false;
        }
        return true;
      }),
      ...params,
    };

    const stream = client.runs.stream(
      useGraphInput.threadId,
      useGraphInput.assistantId,
      {
        input,
        streamMode: "events",
      }
    );

    let fullArtifactGenerationStr = "";
    let artifactId = "";
    let artifactTitle = "";
    let artifactType = "";
    let updatingArtifactId = "";
    let newArtifactText = "";

    // All the text up until the startCharIndex
    let updatedArtifactStartContent: string | undefined = undefined;
    // All the text after the endCharIndex
    let updatedArtifactRestContent: string | undefined = undefined;

    let messageId: string | undefined = undefined;
    let runId: string | undefined = undefined;

    // The last message in a given graph invocation
    let _lastMessage: Record<string, any> | undefined = undefined;

    for await (const chunk of stream) {
      if (!runId && chunk.data?.metadata?.run_id) {
        runId = chunk.data.metadata.run_id;
      }

      if (chunk.data.event === "on_chat_model_stream") {
        if (chunk.data.metadata.langgraph_node === "generateArtifact") {
          if (!artifactId && chunk.data.data.chunk[1].id) {
            artifactId = chunk.data.data.chunk[1].id;
          }
          fullArtifactGenerationStr +=
            chunk.data.data.chunk?.[1]?.tool_call_chunks?.[0]?.args;
          try {
            const artifact: ArtifactToolResponse = parsePartialJson(
              fullArtifactGenerationStr
            );
            artifactTitle = artifact.title ?? "";
            artifactType = artifact.type ?? "";
            if (
              (artifact.artifact && artifactId && artifactType === "text") ||
              artifactType === "code"
            ) {
              setArtifacts((prev) => {
                const allWithoutCurrent = prev.filter(
                  (a) => a.id !== artifactId
                );
                let content = artifact.artifact;
                if (artifactType === "code") {
                  content = removeCodeBlockFormatting(content ?? "");
                }

                return [
                  ...allWithoutCurrent,
                  {
                    id: artifactId,
                    title: artifactTitle,
                    content: content ?? "",
                    type: artifactType as Artifact["type"],
                    language: artifact.language ?? "",
                  },
                ];
              });
              // Ensure the newest generated artifact is selected when generating.
              if (!selectedArtifactId || selectedArtifactId !== artifactId) {
                setSelectedArtifactId(artifactId);
              }
            }
          } catch (_) {
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
            } else {
              // One of the above have been populated, now we can update the start to contain the new text.
              updatedArtifactStartContent += partialUpdatedContent;
            }

            setArtifacts((prev) =>
              prev.map((artifact) => {
                if (artifact.id === updatingArtifactId) {
                  let content = `${updatedArtifactStartContent}${updatedArtifactRestContent}`;
                  if (artifactType === "code") {
                    content = removeCodeBlockFormatting(content);
                  }

                  return {
                    ...artifact,
                    content,
                  };
                }
                return artifact;
              })
            );
            if (!selectedArtifactId) {
              setSelectedArtifactId(updatingArtifactId);
            }
          }
        } else if (
          [
            "rewriteArtifact",
            "rewriteArtifactTheme",
            "rewriteCodeArtifactTheme",
          ].includes(chunk.data.metadata.langgraph_node)
        ) {
          if (updatingArtifactId) {
            newArtifactText += chunk.data.data.chunk[1].content;

            // Ensure we have the language to update the artifact with
            const artifactLanguage = params.portLanguage || undefined;

            // If no highlight, update the entire content as before
            setArtifacts((prev) => {
              return prev.map((artifact) => {
                if (artifact.id === updatingArtifactId) {
                  let content = newArtifactText;
                  if (artifactType === "code") {
                    content = removeCodeBlockFormatting(content);
                  }

                  return {
                    ...artifact,
                    language: artifactLanguage ?? artifact.language,
                    content,
                  };
                }
                return artifact;
              });
            });
            if (!selectedArtifactId) {
              setSelectedArtifactId(updatingArtifactId);
            }
          }
        } else if (chunk.data.metadata.langgraph_node === "generateFollowup") {
          const message = chunk.data.data.chunk[1];
          messageId = message.id;
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
          messageId = message.id;
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
      }

      if (chunk.data.event === "on_chain_start") {
        if (
          [
            "rewriteArtifact",
            "rewriteArtifactTheme",
            "rewriteCodeArtifactTheme",
            "updateArtifact",
          ].includes(chunk.data.metadata.langgraph_node)
        ) {
          if (
            chunk.data.data?.input?.selectedArtifactId &&
            !updatingArtifactId
          ) {
            updatingArtifactId = chunk.data.data?.input?.selectedArtifactId;
          }
        }

        if (chunk.data.metadata.langgraph_node === "cleanState") {
          if (chunk.data.data?.input?.messages?.length) {
            _lastMessage =
              chunk.data.data?.input?.messages[
                chunk.data.data?.input?.messages.length - 1
              ];
          }
        }
      }
    }

    if (runId) {
      // Chain `.then` to not block the stream
      shareRun(runId).then(async (sharedRunURL) => {
        setMessages((prevMessages) => {
          const newMsgs = prevMessages.map((msg) => {
            if (
              msg.id === messageId &&
              !(msg as AIMessage).tool_calls?.find(
                (tc) => tc.name === "langsmith_tool_ui"
              )
            ) {
              const toolCall = {
                name: "langsmith_tool_ui",
                args: { sharedRunURL },
                id: sharedRunURL
                  ?.split("https://smith.langchain.com/public/")[1]
                  .split("/")[0],
              };
              const castMsg = msg as AIMessage;
              const newMessageWithToolCall = new AIMessage({
                ...castMsg,
                content: castMsg.content,
                id: castMsg.id,
                tool_calls: castMsg.tool_calls
                  ? [...castMsg.tool_calls, toolCall]
                  : [toolCall],
              });
              return newMessageWithToolCall;
            }
            return msg;
          });
          return newMsgs;
        });

        // if (useGraphInput.threadId && lastMessage) {
        //   // Update the state of the last message to include the run URL
        //   // for proper rendering when loading history.
        //   if (lastMessage.type === "ai") {
        //     const newMessages = [new RemoveMessage({ id: lastMessage.id }), new AIMessage({
        //       ...lastMessage,
        //       content: lastMessage.content,
        //       response_metadata: {
        //         ...lastMessage.response_metadata,
        //         langSmithRunURL: sharedRunURL,
        //       }
        //     })];
        //     await client.threads.updateState(useGraphInput.threadId, {
        //       values: {
        //         messages: newMessages
        //       },
        //     });
        //     const newState = await client.threads.getState(useGraphInput.threadId);
        //   }
        // }
      });
    }

    // Check to see if there is an AIMessage with a tool call that contains the same artifact ID. If not, add one to render the tool.
    // Only do this if we have the title.
    if (artifactId && artifactTitle) {
      const hasArtifactToolCall = messages.some((msg) => {
        if (msg._getType() !== "ai") return false;
        const aiMsg = msg as AIMessage;
        if (!aiMsg.tool_calls) return false;
        return aiMsg.tool_calls.some((tc) => tc.id === artifactId);
      });
      if (!hasArtifactToolCall) {
        setMessages((prevMessages) => {
          const lastHumanIndex = prevMessages.findLastIndex(
            (msg) => msg._getType() === "human"
          );
          const newMessage = new AIMessage({
            content: "",
            tool_calls: [
              {
                id: artifactId,
                args: { title: artifactTitle },
                name: "artifact_ui",
              },
            ],
          });

          if (lastHumanIndex === -1) {
            // If no human message found, add to the end
            return [...prevMessages, newMessage];
          } else {
            // Insert after the last human message
            return [
              ...prevMessages.slice(0, lastHumanIndex + 1),
              newMessage,
              ...prevMessages.slice(lastHumanIndex + 1),
            ];
          }
        });
      }
    }
  };

  const setSelectedArtifactById = useCallback(
    (id: string | undefined) => {
      if (!id) {
        setSelectedArtifactId(undefined);
        return;
      }

      const selectedArtifact = artifacts.find((a) => a.id === id);
      if (!selectedArtifact) {
        if (!selectedArtifactId && artifacts.length) {
          setSelectedArtifactId(artifacts[artifacts.length - 1].id);
          return;
        } else {
          toast({
            title: "Error",
            description: "Selected artifact not found",
          });
          return;
        }
      }
      setSelectedArtifactId(selectedArtifact.id);
    },
    [artifacts, toast, setSelectedArtifactId]
  );

  const setArtifactContent = (id: string, content: string) => {
    setArtifacts((prev) => {
      return prev.map((artifact) => {
        if (artifact.id === id) {
          return {
            ...artifact,
            content: reverseCleanContent(content),
          };
        }
        return artifact;
      });
    });
  };

  const switchSelectedThread = (
    thread: Thread,
    setThreadId: (id: string) => void
  ) => {
    setThreadId(thread.thread_id);
    const castValues = thread.values as {
      artifacts?: Artifact[];
      messages?: Record<string, any>[];
    };
    if (!castValues?.messages?.length) {
      setMessages([]);
      return;
    }
    setArtifacts(castValues.artifacts ?? []);
    setMessages(
      castValues.messages.flatMap((msg: Record<string, any>) => {
        let artifactMsg: AIMessage | undefined = undefined;
        if (msg.response_metadata?.artifactId) {
          // This is the followup message after an artifact was generated.
          // Add that artifact to the list of artifacts, and an AIMessage with
          // an artifact tool call so it's rendered.
          const generatedArtifact = castValues.artifacts?.find(
            (a) => a.id === msg.response_metadata.artifactId
          );
          if (generatedArtifact) {
            artifactMsg = new AIMessage({
              content: "",
              tool_calls: [
                {
                  id: msg.response_metadata.artifactId,
                  args: { title: generatedArtifact.title },
                  name: "artifact_ui",
                },
              ],
            });
          }
        }

        if (msg.response_metadata?.langSmithRunURL) {
          msg.tool_calls = msg.tool_calls ?? [];
          msg.tool_calls.push({
            name: "langsmith_tool_ui",
            args: { sharedRunURL: msg.response_metadata.langSmithRunURL },
            id: msg.response_metadata.langSmithRunURL
              ?.split("https://smith.langchain.com/public/")[1]
              .split("/")[0],
          });
        }

        return [...(artifactMsg ? [artifactMsg] : []), msg] as BaseMessage[];
      })
    );
  };

  return {
    artifacts,
    selectedArtifactId,
    messages,
    setSelectedArtifact: setSelectedArtifactById,
    setArtifacts,
    setMessages,
    streamMessage,
    setArtifactContent,
    clearState,
    switchSelectedThread,
  };
}
