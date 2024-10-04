import {
  Annotation,
  MessagesAnnotation,
  START,
  StateGraph,
} from "@langchain/langgraph";
import { ChatAnthropic } from "@langchain/anthropic";
import { z } from "zod";
import {
  AIMessage,
  BaseMessage,
  RemoveMessage,
} from "@langchain/core/messages";
import { v4 as uuidv4 } from "uuid";
import {
  FOLLOWUP_ARTIFACT_PROMPT,
  GENERATE_ARTIFACT_METADATA_PROMPT,
  NEW_ARTIFACT_PROMPT,
  ROUTE_QUERY_PROMPT,
  UPDATE_ENTIRE_ARTIFACT_PROMPT,
  UPDATE_HIGHLIGHTED_ARTIFACT_PROMPT,
} from "./prompts";

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
});

const formatArtifacts = (messages: BaseMessage[], truncate?: boolean): string =>
  messages
    .filter((msg) => msg.response_metadata.isArtifact)
    .map((artifact) => {
      const content = truncate
        ? `${artifact.content.slice(0, 500)}${artifact.content.length > 500 ? "..." : ""}`
        : artifact.content;
      return `Title: ${artifact.response_metadata.title}\nContent: ${content}`;
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
    formatArtifacts(state.messages)
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
const updateArtifact = async (state: typeof GraphAnnotation.State) => {
  const smallModel = new ChatAnthropic({
    model: "claude-3-haiku-20240307",
    temperature: 0.5,
  });

  const selectedArtifact = state.messages.find(
    (msg) => msg.id === state.selectedArtifactId
  );
  if (!selectedArtifact) {
    throw new Error("No artifact found with the selected ID");
  }

  if (state.highlighted) {
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

    // Return a `RemoveMessage` to delete the original artifact message from the history.
    const removeMessage = new RemoveMessage({ id: selectedArtifact.id ?? "" });

    const entireTextBefore = selectedArtifact.content.slice(
      0,
      state.highlighted.startCharIndex
    );
    const entireTextAfter = selectedArtifact.content.slice(
      state.highlighted.endCharIndex
    );
    const entireUpdatedContent = `${entireTextBefore}${updatedArtifact.content}${entireTextAfter}`;
    updatedArtifact.content = entireUpdatedContent;
    updatedArtifact.response_metadata.isArtifact = true;
    return {
      messages: [removeMessage, updatedArtifact],
    };
  } else {
    const formattedPrompt = UPDATE_ENTIRE_ARTIFACT_PROMPT.replace(
      "{artifactContent}",
      selectedArtifact.content as string
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
    newArtifact.response_metadata.isArtifact = true;

    // Remove the original artifact message from the history.
    const removeMessage = new RemoveMessage({ id: selectedArtifact.id ?? "" });
    return {
      messages: [removeMessage, newArtifact],
    };
  }
};

/**
 * Generate a new artifact based on the user's query.
 */
const generateArtifact = async (state: typeof GraphAnnotation.State) => {
  const smallModel = new ChatAnthropic({
    model: "claude-3-haiku-20240307",
    temperature: 0.5,
  });

  const response = await smallModel.invoke([
    { role: "system", content: NEW_ARTIFACT_PROMPT },
    ...state.messages,
  ]);

  const formattedPrompt = GENERATE_ARTIFACT_METADATA_PROMPT.replace(
    "{artifactContent}",
    response.content as string
  );
  const modelWithTool = smallModel.withStructuredOutput(
    z.object({
      followup: z.string(),
      title: z
        .string()
        .describe(
          "A short title to give to the artifact. Ensure this is less than 5 words."
        ),
    }),
    {
      name: "generate_artifact_metadata",
    }
  );

  const artifactMetadataRes = await modelWithTool.invoke([
    {
      role: "user",
      content: formattedPrompt,
    },
  ]);

  // This is used on the frontend to render the artifact, and prevent it from being rendered in the chat window.
  response.response_metadata.isArtifact = true;
  response.response_metadata.title = artifactMetadataRes.title;

  const followupMessage = new AIMessage({
    content: artifactMetadataRes.followup,
    id: uuidv4(),
  });
  return {
    messages: [response, followupMessage],
  };
};

/**
 * Generate a followup message after generating or updating an artifact.
 */
const generateFollowup = async (state: typeof GraphAnnotation.State) => {
  const smallModel = new ChatAnthropic({
    model: "claude-3-haiku-20240307",
    temperature: 0.5,
  });

  const recentMessages = state.messages.slice(-3);
  const response = await smallModel.invoke([
    { role: "system", content: FOLLOWUP_ARTIFACT_PROMPT },
    ...recentMessages,
  ]);

  return {
    messages: [response],
  };
};

/**
 * Routes to the proper node in the graph based on the user's query.
 */
const routeQuery = async (
  state: typeof GraphAnnotation.State
): Promise<"updateArtifact" | "respondToQuery" | "generateArtifact"> => {
  if (state.highlighted) {
    return "updateArtifact";
  }

  // Call model and decide if we need to respond to a users query, or generate a new artifact
  const formattedPrompt = ROUTE_QUERY_PROMPT.replace(
    "{recentMessages}",
    state.messages
      .slice(-3)
      .map((message) => `${message._getType()}: ${message.content}`)
      .join("\n\n")
  ).replace("{artifacts}", formatArtifacts(state.messages, true));

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
  return result.route;
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
  .addEdge("updateArtifact", "generateFollowup");

export const graph = builder.compile();
