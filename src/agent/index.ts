import {
  Annotation,
  END,
  MessagesAnnotation,
  Send,
  START,
  StateGraph,
} from "@langchain/langgraph";
import { ChatAnthropic } from "@langchain/anthropic";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import {
  FOLLOWUP_ARTIFACT_PROMPT,
  NEW_ARTIFACT_PROMPT,
  ROUTE_QUERY_PROMPT,
  UPDATE_ENTIRE_ARTIFACT_PROMPT,
  UPDATE_HIGHLIGHTED_ARTIFACT_PROMPT,
} from "./prompts";

interface Artifact {
  id: string;
  content: string;
  title: string;
}

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
  highlighted: Annotation<Highlight>,
  /**
   * The artifacts that have been generated in the conversation.
   */
  artifacts: Annotation<Artifact[]>({
    reducer: (_state, update) => update,
    default: () => [],
  }),
});

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
const respondToQuery = async (state: typeof GraphAnnotation.State) => {
  const smallModel = new ChatAnthropic({
    model: "claude-3-haiku-20240307",
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
 *
 * TODO: break into two nodes, one for updating and one for regenerating.
 */
const updateArtifact = async (state: typeof GraphAnnotation.State) => {
  console.log("Updating artifact", state.selectedArtifactId);
  const smallModel = new ChatAnthropic({
    model: "claude-3-haiku-20240307",
    temperature: 0.5,
  });

  const selectedArtifact = state.artifacts.find(
    (artifact) => artifact.id === state.selectedArtifactId
  );
  if (!selectedArtifact) {
    throw new Error("No artifact found with the selected ID");
  }

  if (!state.highlighted) {
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
    const newArtifacts = [
      ...state.artifacts.filter(
        (artifact) => artifact.id !== selectedArtifact.id
      ),
      {
        ...selectedArtifact,
        content: newArtifact.content,
      },
    ];

    return {
      artifacts: newArtifacts,
    };
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

/**
 * Generate a new artifact based on the user's query.
 */
const generateArtifact = async (state: typeof GraphAnnotation.State) => {
  const smallModel = new ChatAnthropic({
    model: "claude-3-haiku-20240307",
    temperature: 0.5,
  });

  const modelWithArtifactTool = smallModel
    .withStructuredOutput(
      z.object({
        artifact: z
          .string()
          .describe("The content of the artifact to generate."),
        title: z
          .string()
          .describe(
            "A short title to give to the artifact. Should be less than 5 words."
          ),
      }),
      {
        name: "generate_artifact",
      }
    )
    .withConfig({ runName: "generate_artifact" });

  const response = await modelWithArtifactTool.invoke([
    { role: "system", content: NEW_ARTIFACT_PROMPT },
    ...state.messages,
  ]);
  const newArtifact = {
    id: uuidv4(),
    content: response.artifact,
    title: response.title,
  };

  return {
    artifacts: [...(state.artifacts ?? []), newArtifact],
  };
};

/**
 * Generate a followup message after generating or updating an artifact.
 */
const generateFollowup = async (state: typeof GraphAnnotation.State) => {
  const smallModel = new ChatAnthropic({
    model: "claude-3-haiku-20240307",
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
const routeQuery = async (state: typeof GraphAnnotation.State) => {
  if (state.highlighted) {
    return new Send("updateArtifact", {
      ...state,
      selectedArtifactId: state.highlighted.id,
    });
  }

  // Call model and decide if we need to respond to a users query, or generate a new artifact
  const formattedPrompt = ROUTE_QUERY_PROMPT.replace(
    "{recentMessages}",
    state.messages
      .slice(-3)
      .map((message) => `${message._getType()}: ${message.content}`)
      .join("\n\n")
  ).replace("{artifacts}", formatArtifacts(state.artifacts, true));

  const modelWithTool = new ChatAnthropic({
    model: "claude-3-haiku-20240307",
    temperature: 0.5,
  }).withStructuredOutput(
    z.object({
      route: z.enum(["updateArtifact", "respondToQuery", "generateArtifact"]),
      // TODO: HOW TO PASS THIS THROUGH TO NEXT NODE.
      // maybe `send`?
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
    return new Send("updateArtifact", {
      ...state,
      selectedArtifactId: result.artifactId,
    });
  } else {
    return result.route;
  }
};

const builder = new StateGraph(GraphAnnotation)
  .addNode("respondToQuery", respondToQuery)
  .addNode("updateArtifact", updateArtifact)
  .addNode("generateArtifact", generateArtifact)
  .addNode("generateFollowup", generateFollowup)
  .addConditionalEdges(START, routeQuery, [
    "updateArtifact",
    "respondToQuery",
    "generateArtifact",
  ])
  .addEdge("generateArtifact", "generateFollowup")
  .addEdge("updateArtifact", "generateFollowup")
  .addEdge("respondToQuery", END)
  .addEdge("generateFollowup", END);

export const graph = builder.compile();
