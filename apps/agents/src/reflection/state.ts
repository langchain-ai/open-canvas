import { ArtifactV3 } from "@opencanvas/shared/types";
import { Annotation, MessagesAnnotation } from "@langchain/langgraph";

export const ReflectionGraphAnnotation = Annotation.Root({
  /**
   * The chat history to reflect on.
   */
  ...MessagesAnnotation.spec,
  /**
   * The artifact to reflect on.
   */
  artifact: Annotation<ArtifactV3 | undefined>,
});

export type ReflectionGraphReturnType = Partial<
  typeof ReflectionGraphAnnotation.State
>;
