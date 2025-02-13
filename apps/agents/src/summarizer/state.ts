import { Annotation, MessagesAnnotation } from "@langchain/langgraph";

export const SummarizerGraphAnnotation = Annotation.Root({
  /**
   * The chat history to reflect on.
   */
  ...MessagesAnnotation.spec,
  /**
   * The original thread ID to use to update the message state.
   */
  threadId: Annotation<string>,
});

export type SummarizeState = typeof SummarizerGraphAnnotation.State;

export type SummarizeGraphReturnType = Partial<SummarizeState>;
