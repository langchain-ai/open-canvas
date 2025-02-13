import { v4 as uuidv4 } from "uuid";
import { LangGraphRunnableConfig } from "@langchain/langgraph";
import {
  convertPDFToText,
  createContextDocumentMessages,
  getModelConfig,
} from "../../../utils.js";
import { ContextDocument } from "@opencanvas/shared/types";
import {
  BaseMessage,
  HumanMessage,
  RemoveMessage,
} from "@langchain/core/messages";
import { OC_HIDE_FROM_UI_KEY } from "@opencanvas/shared/constants";

/**
 * Checks for context documents in a human message, and if found, converts
 * them to a human message with the proper content format.
 */
export async function convertContextDocumentToHumanMessage(
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

export async function fixMisFormattedContextDocMessage(
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
