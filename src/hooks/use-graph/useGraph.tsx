import {
  ALL_MODEL_NAMES,
  DEFAULT_INPUTS,
  THREAD_ID_COOKIE_NAME,
} from "@/constants";
import {
  isArtifactCodeContent,
  isArtifactMarkdownContent,
  isDeprecatedArtifactType,
} from "@/lib/artifact_content_types";
import { setCookie } from "@/lib/cookies";
import { reverseCleanContent } from "@/lib/normalize_string";
import {
  ArtifactLengthOptions,
  ArtifactToolResponse,
  ArtifactType,
  ArtifactV3,
  CodeHighlight,
  LanguageOptions,
  ProgrammingLanguageOptions,
  ReadingLevelOptions,
  RewriteArtifactMetaToolResponse,
  TextHighlight,
} from "@/types";
import { AIMessage, BaseMessage } from "@langchain/core/messages";
import { parsePartialJson } from "@langchain/core/output_parsers";
import { Thread } from "@langchain/langgraph-sdk";
import { debounce } from "lodash";
import { useEffect, useRef, useState } from "react";
import { useToast } from "../use-toast";
import { useRuns } from "../useRuns";
import { createClient } from "../utils";
import {
  convertToArtifactV3,
  createNewGeneratedArtifactFromTool,
  replaceOrInsertMessageChunk,
  updateHighlightedCode,
  updateHighlightedMarkdown,
  updateRewrittenArtifact,
} from "./utils";
// import { DEFAULT_ARTIFACTS, DEFAULT_MESSAGES } from "@/lib/dummy";

export interface GraphInput {
  messages?: Record<string, any>[];

  highlightedCode?: CodeHighlight;
  highlightedText?: TextHighlight;

  artifact?: ArtifactV3;

  language?: LanguageOptions;
  artifactLength?: ArtifactLengthOptions;
  regenerateWithEmojis?: boolean;
  readingLevel?: ReadingLevelOptions;

  addComments?: boolean;
  addLogs?: boolean;
  portLanguage?: ProgrammingLanguageOptions;
  fixBugs?: boolean;
  customQuickActionId?: string;
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

export interface UseGraphInput {
  userId: string;
  threadId: string | undefined;
  assistantId: string | undefined;
  modelName: ALL_MODEL_NAMES;
}

export function useGraph(useGraphInput: UseGraphInput) {
  const { toast } = useToast();
  const { shareRun } = useRuns();
  const [messages, setMessages] = useState<BaseMessage[]>([]);
  const [artifact, setArtifact] = useState<ArtifactV3>();
  const [selectedBlocks, setSelectedBlocks] = useState<TextHighlight>();
  const [isStreaming, setIsStreaming] = useState(false);
  const [updateRenderedArtifactRequired, setUpdateRenderedArtifactRequired] =
    useState(false);
  const lastSavedArtifact = useRef<ArtifactV3 | undefined>(undefined);
  const debouncedAPIUpdate = useRef(
    debounce(
      (artifact: ArtifactV3, threadId: string) =>
        updateArtifact(artifact, threadId),
      5000
    )
  ).current;
  const [isArtifactSaved, setIsArtifactSaved] = useState(true);
  const [threadSwitched, setThreadSwitched] = useState(false);
  const [firstTokenReceived, setFirstTokenReceived] = useState(false);

  // Very hacky way of ensuring updateState is not called when a thread is switched
  useEffect(() => {
    if (threadSwitched) {
      const timer = setTimeout(() => {
        setThreadSwitched(false);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [threadSwitched]);

  useEffect(() => {
    return () => {
      debouncedAPIUpdate.cancel();
    };
  }, [debouncedAPIUpdate]);

  useEffect(() => {
    if (!messages.length || !artifact || !useGraphInput.threadId) return;
    if (updateRenderedArtifactRequired || threadSwitched || isStreaming) return;
    const currentIndex = artifact.currentIndex;
    const currentContent = artifact.contents.find(
      (c) => c.index === currentIndex
    );
    if (!currentContent) return;
    if (
      (artifact.contents.length === 1 &&
        artifact.contents[0].type === "text" &&
        !artifact.contents[0].fullMarkdown) ||
      (artifact.contents[0].type === "code" && !artifact.contents[0].code)
    ) {
      // If the artifact has only one content and it's empty, we shouldn't update the state
      return;
    }

    if (
      !lastSavedArtifact.current ||
      lastSavedArtifact.current.contents !== artifact.contents
    ) {
      setIsArtifactSaved(false);
      // This means the artifact in state does not match the last saved artifact
      // We need to update
      debouncedAPIUpdate(artifact, useGraphInput.threadId);
    }
  }, [artifact]);

  const updateArtifact = async (
    artifactToUpdate: ArtifactV3,
    threadId: string
  ) => {
    if (isStreaming) return;
    try {
      const client = createClient();
      await client.threads.updateState(threadId, {
        values: {
          artifact: artifactToUpdate,
        },
      });
      setIsArtifactSaved(true);
      lastSavedArtifact.current = artifactToUpdate;
    } catch (e) {
      console.error("Failed to update artifact", e);
      console.error("Artifact:", artifactToUpdate);
    }
  };

  const clearState = () => {
    setMessages([]);
    setArtifact(undefined);
    setFirstTokenReceived(true);
  };

  const streamMessageV2 = async (params: GraphInput) => {
    setFirstTokenReceived(false);

    if (!useGraphInput.threadId) {
      toast({
        title: "Error",
        description: "Thread ID not found",
        variant: "destructive",
        duration: 5000,
      });
      return undefined;
    }
    if (!useGraphInput.assistantId) {
      toast({
        title: "Error",
        description: "Assistant ID not found",
        variant: "destructive",
        duration: 5000,
      });
      return undefined;
    }

    const client = createClient();

    // TODO: update to properly pass the highlight data back
    // one field for highlighted text, and one for code
    const input = {
      ...DEFAULT_INPUTS,
      artifact,
      ...params,
      ...(selectedBlocks && {
        highlightedText: selectedBlocks,
      }),
    };
    // Add check for multiple defined fields
    const fieldsToCheck = [
      input.highlightedCode,
      input.highlightedText,
      input.language,
      input.artifactLength,
      input.regenerateWithEmojis,
      input.readingLevel,
      input.addComments,
      input.addLogs,
      input.fixBugs,
      input.portLanguage,
      input.customQuickActionId,
    ];

    if (fieldsToCheck.filter((field) => field !== undefined).length >= 2) {
      toast({
        title: "Error",
        description:
          "Can not use multiple fields (quick actions, highlights, etc.) at once. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }

    setIsStreaming(true);
    // The root level run ID of this stream
    let runId = "";
    let followupMessageId = "";
    // let lastMessage: AIMessage | undefined = undefined;
    try {
      const stream = client.runs.stream(
        useGraphInput.threadId,
        useGraphInput.assistantId,
        {
          input,
          streamMode: "events",
          config: {
            configurable: {
              customModelName: useGraphInput.modelName,
            },
          },
        }
      );

      // Variables to keep track of content specific to this stream
      const prevCurrentContent = artifact
        ? artifact.contents.find((a) => a.index === artifact.currentIndex)
        : undefined;

      // The new index of the artifact that is generating
      let newArtifactIndex = 1;
      if (artifact) {
        newArtifactIndex = artifact.contents.length + 1;
      }

      // The metadata generated when re-writing an artifact
      let rewriteArtifactMeta: RewriteArtifactMetaToolResponse | undefined =
        undefined;

      // For generating an artifact
      let generateArtifactToolCallStr = "";

      // For updating code artifacts
      // All the text up until the startCharIndex
      let updatedArtifactStartContent: string | undefined = undefined;
      // All the text after the endCharIndex
      let updatedArtifactRestContent: string | undefined = undefined;
      // Whether or not the first update has been made when updating highlighted code.
      let isFirstUpdate = true;

      // The new text of an artifact that is being rewritten
      let newArtifactContent = "";

      // The updated full markdown text when using the highlight update tool
      let highlightedText: TextHighlight | undefined = undefined;

      for await (const chunk of stream) {
        try {
          if (!runId && chunk.data?.metadata?.run_id) {
            runId = chunk.data.metadata.run_id;
          }
          if (chunk.data.event === "on_chain_start") {
            if (
              chunk.data.metadata.langgraph_node === "updateHighlightedText"
            ) {
              highlightedText = chunk.data.data?.input?.highlightedText;
            }
          }

          if (chunk.data.event === "on_chat_model_stream") {
            // These are generating new messages to insert to the chat window.
            if (
              ["generateFollowup", "respondToQuery"].includes(
                chunk.data.metadata.langgraph_node
              )
            ) {
              const message = chunk.data.data.chunk[1];
              if (!followupMessageId) {
                followupMessageId = message.id;
              }
              setMessages((prevMessages) =>
                replaceOrInsertMessageChunk(prevMessages, message)
              );
            }

            if (chunk.data.metadata.langgraph_node === "generateArtifact") {
              generateArtifactToolCallStr +=
                chunk.data.data.chunk?.[1]?.tool_call_chunks?.[0]?.args;
              let newArtifactText: ArtifactToolResponse | undefined = undefined;

              // Attempt to parse the tool call chunk.
              try {
                newArtifactText = parsePartialJson(generateArtifactToolCallStr);
                if (!newArtifactText) {
                  throw new Error("Failed to parse new artifact text");
                }
                newArtifactText = {
                  ...newArtifactText,
                  title: newArtifactText.title ?? "",
                  type: newArtifactText.type ?? "",
                };
              } catch (_) {
                continue;
              }

              if (
                newArtifactText.artifact &&
                (newArtifactText.type === "text" ||
                  (newArtifactText.type === "code" && newArtifactText.language))
              ) {
                setFirstTokenReceived(true);
                setArtifact(() => {
                  const content =
                    createNewGeneratedArtifactFromTool(newArtifactText);
                  if (!content) {
                    return undefined;
                  }
                  return {
                    currentIndex: 1,
                    contents: [content],
                  };
                });
              }
            }

            if (
              chunk.data.metadata.langgraph_node === "updateHighlightedText"
            ) {
              const message = chunk.data.data?.chunk[1];
              if (!message) {
                continue;
              }
              if (!artifact) {
                console.error(
                  "No artifacts found when updating highlighted markdown..."
                );
                continue;
              }
              if (!highlightedText) {
                toast({
                  title: "Error",
                  description: "No highlighted text found",
                  variant: "destructive",
                  duration: 5000,
                });
                continue;
              }
              if (!prevCurrentContent) {
                toast({
                  title: "Error",
                  description: "Original artifact not found",
                  variant: "destructive",
                  duration: 5000,
                });
                return;
              }
              if (!isArtifactMarkdownContent(prevCurrentContent)) {
                toast({
                  title: "Error",
                  description: "Received non markdown block update",
                  variant: "destructive",
                  duration: 5000,
                });
                return;
              }

              const partialUpdatedContent = message.content || "";
              const startIndexOfHighlightedText =
                highlightedText.fullMarkdown.indexOf(
                  highlightedText.markdownBlock
                );

              if (
                updatedArtifactStartContent === undefined &&
                updatedArtifactRestContent === undefined
              ) {
                // Initialize the start and rest content on first chunk
                updatedArtifactStartContent =
                  highlightedText.fullMarkdown.slice(
                    0,
                    startIndexOfHighlightedText
                  );
                updatedArtifactRestContent = highlightedText.fullMarkdown.slice(
                  startIndexOfHighlightedText +
                    highlightedText.markdownBlock.length
                );
              }

              if (
                updatedArtifactStartContent !== undefined &&
                updatedArtifactRestContent !== undefined
              ) {
                updatedArtifactStartContent += partialUpdatedContent;
              }

              const firstUpdateCopy = isFirstUpdate;
              setFirstTokenReceived(true);
              setArtifact((prev) => {
                return updateHighlightedMarkdown(
                  prev ?? artifact,
                  `${updatedArtifactStartContent}${updatedArtifactRestContent}`,
                  newArtifactIndex,
                  prevCurrentContent,
                  firstUpdateCopy
                );
              });

              if (isFirstUpdate) {
                isFirstUpdate = false;
              }
            }

            if (chunk.data.metadata.langgraph_node === "updateArtifact") {
              if (!artifact) {
                toast({
                  title: "Error",
                  description: "Original artifact not found",
                  variant: "destructive",
                  duration: 5000,
                });
                return;
              }
              if (!params.highlightedCode) {
                toast({
                  title: "Error",
                  description: "No highlighted code found",
                  variant: "destructive",
                  duration: 5000,
                });
                return;
              }

              const partialUpdatedContent =
                chunk.data.data.chunk?.[1]?.content || "";
              const { startCharIndex, endCharIndex } = params.highlightedCode;

              if (!prevCurrentContent) {
                toast({
                  title: "Error",
                  description: "Original artifact not found",
                  variant: "destructive",
                  duration: 5000,
                });
                return;
              }
              if (prevCurrentContent.type !== "code") {
                toast({
                  title: "Error",
                  description: "Received non code block update",
                  variant: "destructive",
                  duration: 5000,
                });
                return;
              }

              if (
                updatedArtifactStartContent === undefined &&
                updatedArtifactRestContent === undefined
              ) {
                updatedArtifactStartContent = prevCurrentContent.code.slice(
                  0,
                  startCharIndex
                );
                updatedArtifactRestContent =
                  prevCurrentContent.code.slice(endCharIndex);
              } else {
                // One of the above have been populated, now we can update the start to contain the new text.
                updatedArtifactStartContent += partialUpdatedContent;
              }
              const firstUpdateCopy = isFirstUpdate;
              setFirstTokenReceived(true);
              setArtifact((prev) => {
                const content = removeCodeBlockFormatting(
                  `${updatedArtifactStartContent}${updatedArtifactRestContent}`
                );
                return updateHighlightedCode(
                  prev ?? artifact,
                  content,
                  newArtifactIndex,
                  prevCurrentContent,
                  firstUpdateCopy
                );
              });

              if (isFirstUpdate) {
                isFirstUpdate = false;
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
                  variant: "destructive",
                  duration: 5000,
                });
                return;
              }

              newArtifactContent += chunk.data.data.chunk?.[1]?.content || "";

              // Ensure we have the language to update the artifact with
              let artifactLanguage = params.portLanguage || undefined;
              if (
                !artifactLanguage &&
                rewriteArtifactMeta.type === "code" &&
                rewriteArtifactMeta.programmingLanguage
              ) {
                // If the type is `code` we should have a programming language populated
                // in the rewriteArtifactMeta and can use that.
                artifactLanguage =
                  rewriteArtifactMeta.programmingLanguage as ProgrammingLanguageOptions;
              } else if (!artifactLanguage) {
                artifactLanguage =
                  (prevCurrentContent?.title as ProgrammingLanguageOptions) ??
                  "other";
              }

              const firstUpdateCopy = isFirstUpdate;
              setFirstTokenReceived(true);
              setArtifact((prev) => {
                let content = newArtifactContent;
                if (!rewriteArtifactMeta) {
                  console.error(
                    "No rewrite artifact meta found when updating artifact"
                  );
                  return prev;
                }
                if (rewriteArtifactMeta.type === "code") {
                  content = removeCodeBlockFormatting(content);
                }

                return updateRewrittenArtifact({
                  prevArtifact: prev ?? artifact,
                  newArtifactContent: content,
                  rewriteArtifactMeta: rewriteArtifactMeta,
                  prevCurrentContent,
                  newArtifactIndex,
                  isFirstUpdate: firstUpdateCopy,
                  artifactLanguage,
                });
              });

              if (isFirstUpdate) {
                isFirstUpdate = false;
              }
            }

            if (
              [
                "rewriteArtifactTheme",
                "rewriteCodeArtifactTheme",
                "customAction",
              ].includes(chunk.data.metadata.langgraph_node)
            ) {
              if (!artifact) {
                toast({
                  title: "Error",
                  description: "Original artifact not found",
                  variant: "destructive",
                  duration: 5000,
                });
                return;
              }
              if (!prevCurrentContent) {
                toast({
                  title: "Error",
                  description: "Original artifact not found",
                  variant: "destructive",
                  duration: 5000,
                });
                return;
              }

              newArtifactContent += chunk.data.data.chunk?.[1]?.content || "";

              // Ensure we have the language to update the artifact with
              const artifactLanguage =
                params.portLanguage ||
                (isArtifactCodeContent(prevCurrentContent)
                  ? prevCurrentContent.language
                  : "other");

              const langGraphNode = chunk.data.metadata.langgraph_node;
              let artifactType: ArtifactType;
              if (langGraphNode === "rewriteCodeArtifactTheme") {
                artifactType = "code";
              } else if (langGraphNode === "rewriteArtifactTheme") {
                artifactType = "text";
              } else {
                artifactType = prevCurrentContent.type;
              }
              const firstUpdateCopy = isFirstUpdate;
              setFirstTokenReceived(true);
              setArtifact((prev) => {
                let content = newArtifactContent;
                if (artifactType === "code") {
                  content = removeCodeBlockFormatting(content);
                }

                return updateRewrittenArtifact({
                  prevArtifact: prev ?? artifact,
                  newArtifactContent: content,
                  rewriteArtifactMeta: {
                    type: artifactType,
                    title: prevCurrentContent.title,
                    programmingLanguage: artifactLanguage,
                  },
                  prevCurrentContent,
                  newArtifactIndex,
                  isFirstUpdate: firstUpdateCopy,
                  artifactLanguage,
                });
              });

              if (isFirstUpdate) {
                isFirstUpdate = false;
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
            // if (chunk.data?.data.output && "type" in chunk.data.data.output && chunk.data.data.output.type === "ai") {
            //   lastMessage = new AIMessage({
            //     ...chunk.data.data.output,
            //   });
            //   console.log("last message", lastMessage);
            // }
          }
        } catch (e) {
          console.error(
            "Failed to parse stream chunk",
            chunk,
            "\n\nError:\n",
            e
          );
        }
      }
      lastSavedArtifact.current = artifact;
    } catch (e) {
      console.error("Failed to stream message", e);
    } finally {
      setSelectedBlocks(undefined);
      setIsStreaming(false);
    }

    // TODO:
    // Implement an updateState call after streaming is done to update the state of the artifact
    // with the full markdown content of the artifact if it's a text artifact. This is required so
    // users can load the artifact in the future with proper markdown styling.

    if (runId) {
      // Chain `.then` to not block the stream
      shareRun(runId).then(async (sharedRunURL) => {
        setMessages((prevMessages) => {
          const newMsgs = prevMessages.map((msg) => {
            if (
              msg.id === followupMessageId &&
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

        // if (useGraphInput.threadId && lastMessage && lastMessage.id) {
        //   // Update the state of the last message to include the run URL
        //   // for proper rendering when loading history.
        //   const newMessages = [new RemoveMessage({ id: lastMessage.id }), new AIMessage({
        //     ...lastMessage,
        //     content: lastMessage.content,
        //     response_metadata: {
        //       ...lastMessage.response_metadata,
        //       langSmithRunURL: sharedRunURL,
        //     }
        //   })];
        //   await client.threads.updateState(useGraphInput.threadId, {
        //     values: {
        //       messages: newMessages
        //     },
        //   });
        //   const newState = await client.threads.getState(useGraphInput.threadId);
        //   console.log("new state", newState.values);
        // }
      });
    }
  };

  const setSelectedArtifact = (index: number) => {
    setUpdateRenderedArtifactRequired(true);
    setThreadSwitched(true);

    setArtifact((prev) => {
      if (!prev) {
        toast({
          title: "Error",
          description: "No artifactV2 found",
          variant: "destructive",
          duration: 5000,
        });
        return prev;
      }
      const newArtifact = {
        ...prev,
        currentIndex: index,
      };
      lastSavedArtifact.current = newArtifact;
      return newArtifact;
    });
  };

  const setArtifactContent = (index: number, content: string) => {
    setArtifact((prev) => {
      if (!prev) {
        toast({
          title: "Error",
          description: "No artifact found",
          variant: "destructive",
          duration: 5000,
        });
        return prev;
      }
      const newArtifact = {
        ...prev,
        currentIndex: index,
        contents: prev.contents.map((a) => {
          if (a.index === index && a.type === "code") {
            return {
              ...a,
              code: reverseCleanContent(content),
            };
          }
          return a;
        }),
      };
      return newArtifact;
    });
  };

  const switchSelectedThread = (
    thread: Thread,
    setThreadId: (id: string) => void
  ) => {
    setUpdateRenderedArtifactRequired(true);
    setThreadSwitched(true);
    setThreadId(thread.thread_id);
    setCookie(THREAD_ID_COOKIE_NAME, thread.thread_id);

    const castValues: {
      artifact: ArtifactV3 | undefined;
      messages: Record<string, any>[] | undefined;
    } = {
      artifact: undefined,
      messages: (thread.values as Record<string, any>)?.messages || undefined,
    };
    const castThreadValues = thread.values as Record<string, any>;
    if (castThreadValues?.artifact) {
      if (isDeprecatedArtifactType(castThreadValues.artifact)) {
        castValues.artifact = convertToArtifactV3(castThreadValues.artifact);
      } else {
        castValues.artifact = castThreadValues.artifact;
      }
    } else {
      castValues.artifact = undefined;
    }
    lastSavedArtifact.current = castValues?.artifact;

    if (!castValues?.messages?.length) {
      setMessages([]);
      setArtifact(castValues?.artifact);
      return;
    }
    setArtifact(castValues?.artifact);
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
    isStreaming,
    selectedBlocks,
    messages,
    artifact,
    setArtifact,
    setSelectedBlocks,
    setSelectedArtifact,
    setMessages,
    streamMessage: streamMessageV2,
    setArtifactContent,
    clearState,
    switchSelectedThread,
    updateRenderedArtifactRequired,
    setUpdateRenderedArtifactRequired,
    isArtifactSaved,
    firstTokenReceived,
  };
}
