import { v4 as uuidv4 } from "uuid";
import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { z } from "zod";
import { getArtifactContent } from "../../../contexts/utils";
import {
  convertPDFToText,
  createContextDocumentMessages,
  formatArtifactContentWithTemplate,
  getModelConfig,
  getModelFromConfig,
} from "../../utils";
import {
  CURRENT_ARTIFACT_PROMPT,
  NO_ARTIFACT_PROMPT,
  ROUTE_QUERY_OPTIONS_HAS_ARTIFACTS,
  ROUTE_QUERY_OPTIONS_NO_ARTIFACTS,
  ROUTE_QUERY_PROMPT,
} from "../prompts";
import { OpenCanvasGraphAnnotation } from "../state";
import { ContextDocument } from "@/hooks/useAssistants";
import {
  BaseMessage,
  HumanMessage,
  RemoveMessage,
} from "@langchain/core/messages";
import { OC_HIDE_FROM_UI_KEY } from "@/constants";

/**
 * Checks for context documents in a human message, and if found, converts
 * them to a human message with the proper content format.
 */
async function convertContextDocumentToHumanMessage(
  messages: BaseMessage[],
  config: LangGraphRunnableConfig
): Promise<HumanMessage | undefined> {
  const lastMessage = messages[messages.length - 1];
  const documents = lastMessage?.additional_kwargs?.documents as
    | ContextDocument[]
    | undefined;
  if (!documents?.length) {
    return undefined;
  }

  const contextMessages = await createContextDocumentMessages(
    config,
    documents
  );
  return new HumanMessage({
    id: uuidv4(),
    content: [
      ...contextMessages.flatMap((m) =>
        typeof m.content !== "string" ? m.content : []
      ),
    ],
    additional_kwargs: {
      [OC_HIDE_FROM_UI_KEY]: true,
    },
  });
}

async function fixMisFormattedContextDocMessage(
  message: HumanMessage,
  config: LangGraphRunnableConfig
) {
  if (typeof message.content === "string") {
    return undefined;
  }

  const { modelProvider } = getModelConfig(config);
  const newMsgId = uuidv4();
  let changesMade = false;

  if (modelProvider === "openai") {
    const newContentPromises = message.content.map(async (m) => {
      if (
        m.type === "document" &&
        m.source.type === "base64" &&
        m.source.data
      ) {
        changesMade = true;
        // Anthropic format
        return {
          type: "text",
          text: await convertPDFToText(m.source.data),
        };
      } else if (m.type === "application/pdf") {
        changesMade = true;
        // Gemini format
        return {
          type: "text",
          text: await convertPDFToText(m.data),
        };
      }
      return m;
    });
    const newContent = await Promise.all(newContentPromises);
    if (changesMade) {
      return [
        new RemoveMessage({ id: message.id || "" }),
        new HumanMessage({ ...message, id: newMsgId, content: newContent }),
      ];
    }
  } else if (modelProvider === "anthropic") {
    const newContent = message.content.map((m) => {
      if (m.type === "application/pdf") {
        changesMade = true;
        // Gemini format
        return {
          type: "document",
          source: {
            type: "base64",
            media_type: m.type,
            data: m.data,
          },
        };
      }
      return m;
    });
    if (changesMade) {
      return [
        new RemoveMessage({ id: message.id || "" }),
        new HumanMessage({ ...message, id: newMsgId, content: newContent }),
      ];
    }
  } else if (modelProvider === "google-genai") {
    const newContent = message.content.map((m) => {
      if (m.type === "document") {
        changesMade = true;
        // Anthropic format
        return {
          type: "application/pdf",
          data: m.source.data,
        };
      }
      return m;
    });
    if (changesMade) {
      return [
        new RemoveMessage({ id: message.id || "" }),
        new HumanMessage({ ...message, id: newMsgId, content: newContent }),
      ];
    }
  }

  return undefined;
}

/**
 * Routes to the proper node in the graph based on the user's query.
 */
export const generatePath = async (
  state: typeof OpenCanvasGraphAnnotation.State,
  config: LangGraphRunnableConfig
) => {
  const { messages } = state;
  const newMessages: BaseMessage[] = [];
  const docMessage = await convertContextDocumentToHumanMessage(
    messages,
    config
  );
  const existingDocMessage = newMessages.find(
    (m) =>
      Array.isArray(m.content) &&
      m.content.some(
        (c) => c.type === "document" || c.type === "application/pdf"
      )
  );

  if (docMessage) {
    newMessages.push(docMessage);
  } else if (existingDocMessage) {
    const fixedMessages = await fixMisFormattedContextDocMessage(
      existingDocMessage,
      config
    );
    if (fixedMessages) {
      newMessages.push(...fixedMessages);
    }
  }

  if (state.highlightedCode) {
    return {
      next: "updateArtifact",
      ...(newMessages.length ? { messages: newMessages } : {}),
    };
  }
  if (state.highlightedText) {
    return {
      next: "updateHighlightedText",
      ...(newMessages.length ? { messages: newMessages } : {}),
    };
  }

  if (
    state.language ||
    state.artifactLength ||
    state.regenerateWithEmojis ||
    state.readingLevel
  ) {
    return {
      next: "rewriteArtifactTheme",
      ...(newMessages.length ? { messages: newMessages } : {}),
    };
  }

  if (
    state.addComments ||
    state.addLogs ||
    state.portLanguage ||
    state.fixBugs
  ) {
    return {
      next: "rewriteCodeArtifactTheme",
      ...(newMessages.length ? { messages: newMessages } : {}),
    };
  }

  if (state.customQuickActionId) {
    return {
      next: "customAction",
      ...(newMessages.length ? { messages: newMessages } : {}),
    };
  }

  const currentArtifactContent = state.artifact
    ? getArtifactContent(state.artifact)
    : undefined;

  // Call model and decide if we need to respond to a users query, or generate a new artifact
  const formattedPrompt = ROUTE_QUERY_PROMPT.replace(
    "{artifactOptions}",
    currentArtifactContent
      ? ROUTE_QUERY_OPTIONS_HAS_ARTIFACTS
      : ROUTE_QUERY_OPTIONS_NO_ARTIFACTS
  )
    .replace(
      "{recentMessages}",
      state.messages
        .slice(-3)
        .map((message) => `${message.getType()}: ${message.content}`)
        .join("\n\n")
    )
    .replace(
      "{currentArtifactPrompt}",
      currentArtifactContent
        ? formatArtifactContentWithTemplate(
            CURRENT_ARTIFACT_PROMPT,
            currentArtifactContent
          )
        : NO_ARTIFACT_PROMPT
    );

  const artifactRoute = currentArtifactContent
    ? "rewriteArtifact"
    : "generateArtifact";

  const model = await getModelFromConfig(config, {
    temperature: 0,
    isToolCalling: true,
  });
  const modelWithTool = model.withStructuredOutput(
    z.object({
      route: z
        .enum(["replyToGeneralInput", artifactRoute])
        .describe("The route to take based on the user's query."),
    }),
    {
      name: "route_query",
    }
  );

  const contextDocumentMessages = await createContextDocumentMessages(config);
  const result = await modelWithTool.invoke([
    ...contextDocumentMessages,
    ...(newMessages.length ? newMessages : []),
    {
      role: "user",
      content: formattedPrompt,
    },
  ]);

  return {
    next: result.route,
    ...(newMessages.length ? { messages: newMessages } : {}),
  };
};
