import {
  Annotation,
  END,
  MessagesAnnotation,
  Send,
  START,
  StateGraph,
} from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import {
  FOLLOWUP_ARTIFACT_PROMPT,
  NEW_ARTIFACT_PROMPT,
  ROUTE_QUERY_PROMPT,
  UPDATE_ENTIRE_ARTIFACT_PROMPT,
  UPDATE_HIGHLIGHTED_ARTIFACT_PROMPT,
} from "./prompts";
import { Artifact } from "../types";
import { v4 as uuidv4 } from "uuid";

type LanguageOptions = "english" | "mandarin" | "spanish" | "french" | "hindi";

type ArtifactLengthOptions =
  | "shortest"
  | "short"
  | "current"
  | "long"
  | "longest";

type ReadingLevelOptions = "pirate" | "child" | "teenager" | "college" | "phd";

interface Highlight {
  /**
   * The id of the artifact the highlighted text belongs to
   */
  id: string;
  /**
   * The index of the first character of the highlighted text
   */
  startCharIndex: number;
  /**
   * The index of the last character of the highlighted text
   */
  endCharIndex: number;
}

const GraphAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  /**
   * The ID of the artifact to perform some action on.
   */
  selectedArtifactId: Annotation<string>,
  /**
   * The part of the artifact the user highlighted. Use the `selectedArtifactId`
   * to determine which artifact the highlight belongs to.
   */
  highlighted: Annotation<Highlight | undefined>,
  /**
   * The artifacts that have been generated in the conversation.
   */
  artifacts: Annotation<Artifact[]>({
    reducer: (_state, update) => update,
    default: () => [],
  }),
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
});

type GraphReturnType = Partial<typeof GraphAnnotation.State>;

const formatArtifacts = (messages: Artifact[], truncate?: boolean): string =>
  messages
    .map((artifact) => {
      const content = truncate
        ? `${artifact.content.slice(0, 500)}${artifact.content.length > 500 ? "..." : ""}`
        : artifact.content;
      return `Title: ${artifact.title}\nID: ${artifact.id}\nContent: ${content}`;
    })
    .join("\n\n");

/**
 * Generate responses to questions. Does not generate artifacts.
 */
const respondToQuery = async (
  state: typeof GraphAnnotation.State
): Promise<GraphReturnType> => {
  const smallModel = new ChatOpenAI({
    model: "gpt-4o",
    temperature: 0.5,
  });

  const prompt = `You are an AI assistant tasked with responding to the users question.
  
The user has generated artifacts in the past. Use the following artifacts as context when responding to the users question.

<artifacts>
{artifacts}
</artifacts>`;

  const formattedPrompt = prompt.replace(
    "{artifacts}",
    formatArtifacts(state.artifacts)
  );

  const response = await smallModel.invoke([
    { role: "system", content: formattedPrompt },
    ...state.messages,
  ]);

  return {
    messages: [response],
  };
};

/**
 * Update an existing artifact based on the user's query.
 */
const updateArtifact = async (
  state: typeof GraphAnnotation.State
): Promise<GraphReturnType> => {
  const smallModel = new ChatOpenAI({
    model: "gpt-4o",
    temperature: 0.5,
  });

  const selectedArtifact = state.artifacts.find(
    (artifact) => artifact.id === state.selectedArtifactId
  );
  if (!selectedArtifact) {
    throw new Error("No artifact found with the selected ID");
  }

  if (!state.highlighted) {
    throw new Error(
      "Can not partially regenerate an artifact without a highlight"
    );
  }

  // Highlighted text is present, so we need to update the highlighted text.
  const start = Math.max(0, state.highlighted.startCharIndex - 500);
  const end = Math.min(
    selectedArtifact.content.length,
    state.highlighted.endCharIndex + 500
  );

  const beforeHighlight = selectedArtifact.content.slice(
    start,
    state.highlighted.startCharIndex
  ) as string;
  const highlightedText = selectedArtifact.content.slice(
    state.highlighted.startCharIndex,
    state.highlighted.endCharIndex
  ) as string;
  const afterHighlight = selectedArtifact.content.slice(
    state.highlighted.endCharIndex,
    end
  ) as string;

  const formattedPrompt = UPDATE_HIGHLIGHTED_ARTIFACT_PROMPT.replace(
    "{highlightedText}",
    highlightedText
  )
    .replace("{beforeHighlight}", beforeHighlight)
    .replace("{afterHighlight}", afterHighlight);

  const recentHumanMessage = state.messages.findLast(
    (message) => message._getType() === "human"
  );
  if (!recentHumanMessage) {
    throw new Error("No recent human message found");
  }
  const updatedArtifact = await smallModel.invoke([
    { role: "system", content: formattedPrompt },
    recentHumanMessage,
  ]);

  const entireTextBefore = selectedArtifact.content.slice(
    0,
    state.highlighted.startCharIndex
  );
  const entireTextAfter = selectedArtifact.content.slice(
    state.highlighted.endCharIndex
  );
  const entireUpdatedContent = `${entireTextBefore}${updatedArtifact.content}${entireTextAfter}`;
  const newArtifacts = [
    ...state.artifacts.filter(
      (artifact) => artifact.id !== selectedArtifact.id
    ),
    {
      ...selectedArtifact,
      content: entireUpdatedContent,
    },
  ];

  return {
    artifacts: newArtifacts,
  };
};

const rewriteArtifact = async (
  state: typeof GraphAnnotation.State
): Promise<GraphReturnType> => {
  const smallModel = new ChatOpenAI({
    model: "gpt-4o",
    temperature: 0.5,
  });

  const selectedArtifact = state.artifacts.find(
    (artifact) => artifact.id === state.selectedArtifactId
  );
  if (!selectedArtifact) {
    throw new Error("No artifact found with the selected ID");
  }

  // No highlighted text is present, so we need to update the entire artifact.
  const formattedPrompt = UPDATE_ENTIRE_ARTIFACT_PROMPT.replace(
    "{artifactContent}",
    selectedArtifact.content
  );

  const recentHumanMessage = state.messages.findLast(
    (message) => message._getType() === "human"
  );
  if (!recentHumanMessage) {
    throw new Error("No recent human message found");
  }
  const newArtifact = await smallModel.invoke([
    { role: "system", content: formattedPrompt },
    recentHumanMessage,
  ]);

  // Remove the original artifact message from the history.
  const newArtifacts: Artifact[] = [
    ...state.artifacts.filter(
      (artifact) => artifact.id !== selectedArtifact.id
    ),
    {
      ...selectedArtifact,
      content: newArtifact.content as string,
    },
  ];

  return {
    artifacts: newArtifacts,
    highlighted: undefined,
  };
};

/**
 * Generate a new artifact based on the user's query.
 */
const generateArtifact = async (
  state: typeof GraphAnnotation.State
): Promise<GraphReturnType> => {
  const smallModel = new ChatOpenAI({
    model: "gpt-4o",
    temperature: 0.5,
  });

  const modelWithArtifactTool = smallModel.bindTools(
    [
      {
        name: "generate_artifact",
        schema: z.object({
          artifact: z
            .string()
            .describe("The content of the artifact to generate."),
          title: z
            .string()
            .describe(
              "A short title to give to the artifact. Should be less than 5 words."
            ),
        }),
      },
    ],
    { tool_choice: "generate_artifact" }
  );

  const response = await modelWithArtifactTool.invoke(
    [{ role: "system", content: NEW_ARTIFACT_PROMPT }, ...state.messages],
    { runName: "generate_artifact" }
  );
  const newArtifact: Artifact = {
    id: response.id ?? uuidv4(),
    content: response.tool_calls?.[0]?.args.artifact,
    title: response.tool_calls?.[0]?.args.title,
  };

  return {
    artifacts: [...(state.artifacts ?? []), newArtifact],
  };
};

/**
 * Generate a followup message after generating or updating an artifact.
 */
const generateFollowup = async (
  state: typeof GraphAnnotation.State
): Promise<GraphReturnType> => {
  const smallModel = new ChatOpenAI({
    model: "gpt-4o-mini",
    temperature: 0.5,
    maxTokens: 250,
  });

  const recentArtifact = state.artifacts[state.artifacts.length - 1];
  const formattedPrompt = FOLLOWUP_ARTIFACT_PROMPT.replace(
    "{artifactContent}",
    recentArtifact.content
  );
  const response = await smallModel.invoke([
    { role: "user", content: formattedPrompt },
  ]);

  return {
    messages: [response],
  };
};

/**
 * Routes to the proper node in the graph based on the user's query.
 */
const generatePath = async (state: typeof GraphAnnotation.State) => {
  if (state.highlighted) {
    return {
      next: "updateArtifact",
      selectedArtifactId: state.highlighted.id,
    };
  }

  // Call model and decide if we need to respond to a users query, or generate a new artifact
  const formattedPrompt = ROUTE_QUERY_PROMPT.replace(
    "{recentMessages}",
    state.messages
      .slice(-3)
      .map((message) => `${message._getType()}: ${message.content}`)
      .join("\n\n")
  ).replace("{artifacts}", formatArtifacts(state.artifacts, true));

  const modelWithTool = new ChatOpenAI({
    model: "gpt-4o-mini",
    temperature: 0,
  }).withStructuredOutput(
    z.object({
      route: z.enum(["updateArtifact", "respondToQuery", "generateArtifact"]),
      artifactId: z
        .string()
        .optional()
        .describe("The ID of the artifact to update, if applicable."),
    }),
    {
      name: "route_query",
    }
  );

  const result = await modelWithTool.invoke([
    {
      role: "user",
      content: formattedPrompt,
    },
  ]);

  if (result.route === "updateArtifact") {
    return {
      // Only route to the `updateArtifact` node if highlighted text is present.
      // Otherwise we need to rewrite the entire artifact.
      next: "rewriteArtifact",
      selectedArtifactId: result.artifactId,
    };
  } else {
    return {
      next: "result.route",
    };
  }
};

const routeNode = (state: typeof GraphAnnotation.State) => {
  if (!state.next) {
    throw new Error("'next' state field not set.");
  }

  return new Send(state.next, {
    ...state,
  });
};

const builder = new StateGraph(GraphAnnotation)
  .addNode("generatePath", generatePath)
  .addEdge(START, "generatePath")
  .addConditionalEdges("generatePath", routeNode)
  .addNode("respondToQuery", respondToQuery)
  .addNode("rewriteArtifact", rewriteArtifact)
  .addNode("updateArtifact", updateArtifact)
  .addNode("generateArtifact", generateArtifact)
  .addNode("generateFollowup", generateFollowup)
  .addEdge("generateArtifact", "generateFollowup")
  .addEdge("updateArtifact", "generateFollowup")
  .addEdge("rewriteArtifact", "generateFollowup")
  .addEdge("respondToQuery", END)
  .addEdge("generateFollowup", END);

export const graph = builder.compile();
