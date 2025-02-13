import { BaseMessage, BaseMessageLike } from "@langchain/core/messages";
import {
  ArtifactLengthOptions,
  LanguageOptions,
  ProgrammingLanguageOptions,
  ReadingLevelOptions,
  CodeHighlight,
  ArtifactV3,
  TextHighlight,
  SearchResult,
} from "@opencanvas/shared/types";
import {
  Annotation,
  MessagesAnnotation,
  messagesStateReducer,
} from "@langchain/langgraph";
import { OC_SUMMARIZED_MESSAGE_KEY } from "@opencanvas/shared/constants";

export type Messages =
  | Array<BaseMessage | BaseMessageLike>
  | BaseMessage
  | BaseMessageLike;

function isSummaryMessage(msg: unknown): boolean {
  if (typeof msg !== "object" || Array.isArray(msg) || !msg) return false;

  if (!("additional_kwargs" in msg) && !("kwargs" in msg)) return false;

  if (
    "additional_kwargs" in msg &&
    (msg.additional_kwargs as Record<string, any>)?.[
      OC_SUMMARIZED_MESSAGE_KEY
    ] === true
  ) {
    return true;
  }

  if (
    "kwargs" in msg &&
    (msg.kwargs as Record<string, any>)?.additional_kwargs?.[
      OC_SUMMARIZED_MESSAGE_KEY
    ] === true
  ) {
    return true;
  }

  return false;
}

export const OpenCanvasGraphAnnotation = Annotation.Root({
  /**
   * The full list of messages in the conversation.
   */
  ...MessagesAnnotation.spec,
  /**
   * The list of messages passed to the model. Can include summarized messages,
   * and others which are NOT shown to the user.
   */
  _messages: Annotation<BaseMessage[], Messages>({
    reducer: (state, update) => {
      const latestMsg = Array.isArray(update)
        ? update[update.length - 1]
        : update;

      if (isSummaryMessage(latestMsg)) {
        // The state list has been updated by a summary message. Clear the existing state messages.
        return messagesStateReducer([], update);
      }

      return messagesStateReducer(state, update);
    },
    default: () => [],
  }),
  /**
   * The part of the artifact the user highlighted. Use the `selectedArtifactId`
   * to determine which artifact the highlight belongs to.
   */
  highlightedCode: Annotation<CodeHighlight | undefined>,
  /**
   * The highlighted text. This includes the markdown blocks which the highlighted
   * text belongs to, along with the entire plain text content of highlight.
   */
  highlightedText: Annotation<TextHighlight | undefined>,
  /**
   * The artifacts that have been generated in the conversation.
   */
  artifact: Annotation<ArtifactV3>,
  /**
   * The next node to route to. Only used for the first routing node/conditional edge.
   */
  next: Annotation<string | undefined>,
  /**
   * The language to translate the artifact to.
   */
  language: Annotation<LanguageOptions | undefined>,
  /**
   * The length of the artifact to regenerate to.
   */
  artifactLength: Annotation<ArtifactLengthOptions | undefined>,
  /**
   * Whether or not to regenerate with emojis.
   */
  regenerateWithEmojis: Annotation<boolean | undefined>,
  /**
   * The reading level to adjust the artifact to.
   */
  readingLevel: Annotation<ReadingLevelOptions | undefined>,
  /**
   * Whether or not to add comments to the code artifact.
   */
  addComments: Annotation<boolean | undefined>,
  /**
   * Whether or not to add logs to the code artifact.
   */
  addLogs: Annotation<boolean | undefined>,
  /**
   * The programming language to port the code artifact to.
   */
  portLanguage: Annotation<ProgrammingLanguageOptions | undefined>,
  /**
   * Whether or not to fix bugs in the code artifact.
   */
  fixBugs: Annotation<boolean | undefined>,
  /**
   * The ID of the custom quick action to use.
   */
  customQuickActionId: Annotation<string | undefined>,
  /**
   * Whether or not to search the web for additional context.
   */
  webSearchEnabled: Annotation<boolean | undefined>,
  /**
   * The search results to include in context.
   */
  webSearchResults: Annotation<SearchResult[] | undefined>,
});

export type OpenCanvasGraphReturnType = Partial<
  typeof OpenCanvasGraphAnnotation.State
>;
