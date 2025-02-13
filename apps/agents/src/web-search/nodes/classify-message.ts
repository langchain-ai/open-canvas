import { ChatAnthropic } from "@langchain/anthropic";
import { WebSearchState } from "../state.js";
import z from "zod";

const CLASSIFIER_PROMPT = `You're a helpful AI assistant tasked with classifying the user's latest message.
The user has enabled web search for their conversation, however not all messages should be searched.

Analyze their latest message in isolation and determine if it warrants a web search to include additional context.

<message>
{message}
</message>`;

const classificationSchema = z
  .object({
    shouldSearch: z
      .boolean()
      .describe(
        "Whether or not to search the web based on the user's latest message."
      ),
  })
  .describe("The classification of the user's latest message.");

export async function classifyMessage(
  state: WebSearchState
): Promise<Partial<WebSearchState>> {
  const model = new ChatAnthropic({
    model: "claude-3-5-sonnet-latest",
    temperature: 0,
  }).withStructuredOutput(classificationSchema, {
    name: "classify_message",
  });

  const latestMessageContent = state.messages[state.messages.length - 1]
    .content as string;
  const formattedPrompt = CLASSIFIER_PROMPT.replace(
    "{message}",
    latestMessageContent
  );

  const response = await model.invoke([["user", formattedPrompt]]);

  return {
    shouldSearch: response.shouldSearch,
  };
}
