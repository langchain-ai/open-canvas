import { AllModelNames } from "@/agent/lib";
import { reverseCleanContent } from "@/lib/normalize_string";
import {
  Artifact,
  ArtifactContent,
  ArtifactLengthOptions,
  ArtifactType,
  Highlight,
  LanguageOptions,
  ProgrammingLanguageOptions,
  ReadingLevelOptions,
} from "@/types";
import { AIMessage, BaseMessage } from "@langchain/core/messages";
import { parsePartialJson } from "@langchain/core/output_parsers";
import { Thread } from "@langchain/langgraph-sdk";
import { useState } from "react";
import { useToast } from "./use-toast";
import { useRuns } from "./useRuns";
import { createClient } from "./utils";
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
  model?: AllModelNames;
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
  model: AllModelNames;
}

export function useGraph(useGraphInput: UseGraphInput) {
  const { toast } = useToast();
  const { shareRun } = useRuns();
  const [messages, setMessages] = useState<BaseMessage[]>([]);
  const [artifact, setArtifact] = useState<Artifact>();
  const clearState = () => {
    setMessages([]);
    setArtifact(undefined);
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
      artifact,
      model: useGraphInput.model,
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
    let newArtifactText = "";

    // All the text up until the startCharIndex
    let updatedArtifactStartContent: string | undefined = undefined;
    // All the text after the endCharIndex
    let updatedArtifactRestContent: string | undefined = undefined;

    let messageId: string | undefined = undefined;
    let runId: string | undefined = undefined;

    const prevArtifactContent = artifact?.contents.find(
      (a) => a.index === artifact.currentContentIndex
    );
    let newArtifactContentIndex: number | undefined = undefined;
    let isFirstUpdate = true;

    let rewriteArtifactMeta:
      | {
          type: ArtifactType;
          title?: string;
          programmingLanguage?: string;
        }
      | undefined = undefined;

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
            const newArtifactText: ArtifactToolResponse = parsePartialJson(
              fullArtifactGenerationStr
            );
            artifactTitle = newArtifactText.title ?? "";
            artifactType = newArtifactText.type ?? "";
            if (
              (newArtifactText.artifact &&
                artifactId &&
                artifactType === "text") ||
              artifactType === "code"
            ) {
              setArtifact(() => {
                let content = newArtifactText.artifact;
                if (artifactType === "code") {
                  content = removeCodeBlockFormatting(content ?? "");
                }

                return {
                  id: artifactId,
                  currentContentIndex: 1,
                  contents: [
                    {
                      index: 1,
                      content: content ?? "",
                      title: artifactTitle,
                      type: artifactType as ArtifactType,
                      language: newArtifactText.language ?? "",
                    },
                  ],
                };
              });
            }
          } catch (_) {
            // no-op
          }
        }

        if (chunk.data.metadata.langgraph_node === "updateArtifact") {
          if (params.highlighted) {
            if (!artifact) {
              toast({
                title: "Error",
                description: "Original artifact not found",
              });
              return;
            }
            const partialUpdatedContent = chunk.data.data.chunk[1].content;
            const { startCharIndex, endCharIndex } = params.highlighted;

            if (!prevArtifactContent) {
              toast({
                title: "Error",
                description: "Original artifact not found",
              });
              return;
            }

            if (
              updatedArtifactStartContent === undefined &&
              updatedArtifactRestContent === undefined
            ) {
              updatedArtifactStartContent = prevArtifactContent.content.slice(
                0,
                startCharIndex
              );
              updatedArtifactRestContent =
                prevArtifactContent.content.slice(endCharIndex);
            } else {
              // One of the above have been populated, now we can update the start to contain the new text.
              updatedArtifactStartContent += partialUpdatedContent;
            }

            if (newArtifactContentIndex === undefined) {
              newArtifactContentIndex = artifact.contents.length + 1;
            }

            setArtifact((prev) => {
              let content = `${updatedArtifactStartContent}${updatedArtifactRestContent}`;
              if (artifactType === "code") {
                content = removeCodeBlockFormatting(content);
              }

              const newContents: ArtifactContent[] = isFirstUpdate
                ? [
                    ...(prev ?? artifact).contents,
                    {
                      ...(prevArtifactContent as ArtifactContent),
                      index:
                        newArtifactContentIndex ?? artifact.contents.length + 1,
                      content,
                    },
                  ]
                : (prev ?? artifact).contents.map((c) => {
                    if (c.index === newArtifactContentIndex) {
                      return {
                        ...c,
                        content,
                      };
                    }
                    return c;
                  });

              return {
                ...(prev ?? artifact),
                currentContentIndex:
                  newArtifactContentIndex ?? artifact.contents.length + 1,
                contents: newContents,
              };
            });

            if (isFirstUpdate) {
              isFirstUpdate = false;
            }
          }
        }

        if (
          chunk.data.metadata.langgraph_node === "rewriteArtifact" &&
          chunk.data.name === "rewrite_artifact_model_call" &&
          rewriteArtifactMeta
        ) {
          if (!artifact) {
            toast({
              title: "Error",
              description: "Original artifact not found",
            });
            return;
          }

          newArtifactText += chunk.data.data.chunk[1].content;

          // Ensure we have the language to update the artifact with
          let artifactLanguage = params.portLanguage || undefined;
          if (
            !artifactLanguage &&
            rewriteArtifactMeta.type === "code" &&
            rewriteArtifactMeta.programmingLanguage
          ) {
            artifactLanguage =
              rewriteArtifactMeta.programmingLanguage as ProgrammingLanguageOptions;
          }

          if (newArtifactContentIndex === undefined) {
            newArtifactContentIndex = artifact.contents.length + 1;
          }

          setArtifact((prev) => {
            let content = newArtifactText;
            if (rewriteArtifactMeta?.type === "code") {
              content = removeCodeBlockFormatting(content);
            }

            const newContents: ArtifactContent[] = isFirstUpdate
              ? [
                  ...(prev ?? artifact).contents,
                  {
                    type:
                      rewriteArtifactMeta?.type ??
                      prevArtifactContent?.type ??
                      "text",
                    title:
                      rewriteArtifactMeta?.title ??
                      prevArtifactContent?.title ??
                      "",
                    index:
                      newArtifactContentIndex ?? artifact.contents.length + 1,
                    language:
                      artifactLanguage ?? prevArtifactContent?.language ?? "",
                    content,
                  },
                ]
              : (prev ?? artifact).contents.map((c) => {
                  if (c.index === newArtifactContentIndex) {
                    return {
                      ...c,
                      content,
                    };
                  }
                  return c;
                });

            return {
              ...(prev ?? artifact),
              currentContentIndex:
                newArtifactContentIndex ?? artifact.contents.length + 1,
              contents: newContents,
            };
          });

          if (isFirstUpdate) {
            isFirstUpdate = false;
          }
        }

        if (
          ["rewriteArtifactTheme", "rewriteCodeArtifactTheme"].includes(
            chunk.data.metadata.langgraph_node
          )
        ) {
          if (!artifact) {
            toast({
              title: "Error",
              description: "Original artifact not found",
            });
            return;
          }

          newArtifactText += chunk.data.data.chunk[1].content;

          // Ensure we have the language to update the artifact with
          const artifactLanguage = params.portLanguage || undefined;

          if (newArtifactContentIndex === undefined) {
            newArtifactContentIndex = artifact.contents.length + 1;
          }

          setArtifact((prev) => {
            let content = newArtifactText;
            if (prevArtifactContent?.type === "code") {
              content = removeCodeBlockFormatting(content);
            }

            const newContents: ArtifactContent[] = isFirstUpdate
              ? [
                  ...(prev ?? artifact).contents,
                  {
                    type: prevArtifactContent?.type ?? "text",
                    title: prevArtifactContent?.title ?? "",
                    index:
                      newArtifactContentIndex ?? artifact.contents.length + 1,
                    language:
                      artifactLanguage ?? prevArtifactContent?.language ?? "",
                    content,
                  },
                ]
              : (prev ?? artifact).contents.map((c) => {
                  if (c.index === newArtifactContentIndex) {
                    return {
                      ...c,
                      content,
                    };
                  }
                  return c;
                });

            return {
              ...(prev ?? artifact),
              currentContentIndex:
                newArtifactContentIndex ?? artifact.contents.length + 1,
              contents: newContents,
            };
          });

          if (isFirstUpdate) {
            isFirstUpdate = false;
          }
        }

        if (chunk.data.metadata.langgraph_node === "generateFollowup") {
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

        if (chunk.data.metadata.langgraph_node === "respondToQuery") {
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
        if (chunk.data.metadata.langgraph_node === "cleanState") {
          if (chunk.data.data?.input?.messages?.length) {
            _lastMessage =
              chunk.data.data?.input?.messages[
                chunk.data.data?.input?.messages.length - 1
              ];
          }
        }
      }

      if (chunk.data.event === "on_chat_model_end") {
        if (
          chunk.data.metadata.langgraph_node === "rewriteArtifact" &&
          chunk.data.name === "optionally_update_artifact_meta"
        ) {
          rewriteArtifactMeta = chunk.data.data.output.tool_calls[0].args;
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
  };

  const setSelectedArtifact = (index: number) => {
    setArtifact((prev) => {
      if (!prev) {
        toast({
          title: "Error",
          description: "No artifact found",
        });
        return prev;
      }
      return {
        ...prev,
        currentContentIndex: index,
      };
    });
  };

  const setArtifactContent = (index: number, content: string) => {
    setArtifact((prev) => {
      if (!prev) {
        toast({
          title: "Error",
          description: "No artifact found",
        });
        return prev;
      }
      return {
        ...prev,
        currentContentIndex: index,
        contents: prev.contents.map((a) => {
          if (a.index === index) {
            return {
              ...a,
              content: reverseCleanContent(content),
            };
          }
          return a;
        }),
      };
    });
  };

  const switchSelectedThread = (
    thread: Thread,
    setThreadId: (id: string) => void
  ) => {
    setThreadId(thread.thread_id);
    const castValues = thread.values as {
      artifact?: Artifact;
      messages?: Record<string, any>[];
    };
    if (!castValues?.messages?.length) {
      setMessages([]);
      return;
    }
    setArtifact(castValues.artifact);
    setMessages(
      castValues.messages.map((msg: Record<string, any>) => {
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

        return msg as BaseMessage;
      })
    );
  };

  return {
    artifact,
    messages,
    setSelectedArtifact,
    setArtifact,
    setMessages,
    streamMessage,
    setArtifactContent,
    clearState,
    switchSelectedThread,
  };
}
