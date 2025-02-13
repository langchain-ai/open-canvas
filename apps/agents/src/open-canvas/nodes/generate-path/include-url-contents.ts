import { FireCrawlLoader } from "@langchain/community/document_loaders/web/firecrawl";
import { HumanMessage } from "@langchain/core/messages";
import { initChatModel } from "langchain/chat_models/universal";
import { traceable } from "langsmith/traceable";
import z from "zod";

const PROMPT = `You're an advanced AI assistant.
You have been tasked with analyzing the user's message and determining if the user wants the contents of the URL included in their message included in their prompt.
You should ONLY answer 'true' if it is explicitly clear the user included the URL in their message so that its contents would be included in the prompt, otherwise, answer 'false'

Here is the user's message:
<message>
{message}
</message>

Now, given their message, determine whether or not they want the contents of that webpage to be included in the prompt.`;

const schema = z
  .object({
    shouldIncludeUrlContents: z
      .boolean()
      .describe(
        "Whether or not to include the contents of the URL in the prompt."
      ),
  })
  .describe(
    "Whether or not the user's message indicates the contents of the URL should be included in the prompt."
  );

async function fetchUrlContentsFunc(
  url: string
): Promise<{ url: string; pageContent: string }> {
  const loader = new FireCrawlLoader({
    url,
    mode: "scrape",
    params: {
      formats: ["markdown"],
    },
  });

  const docs = await loader.load();
  return {
    url,
    pageContent: docs[0]?.pageContent || "",
  };
}
const fetchUrlContents = traceable(fetchUrlContentsFunc, {
  name: "fetch_url_contents",
});

/**
 * Runs if a URL is found in the input message.
 * It calls an LLM to determine whether or not the user explicitly
 * requested the contents of the URL be included in the prompt.
 * If the LLM determines the user does want this, it will scrape
 * the contents using FireCrawl. Else, it continues as normal.
 */
async function includeURLContentsFunc(
  message: HumanMessage,
  urls: string[]
): Promise<HumanMessage | undefined> {
  try {
    const prompt = message.content as string;

    const model = (
      await initChatModel("gemini-2.0-flash", {
        modelProvider: "google-genai",
        temperature: 0,
      })
    ).bindTools(
      [
        {
          name: "determine_include_url_contents",
          description: schema.description,
          schema,
        },
      ],
      {
        tool_choice: "determine_include_url_contents",
      }
    );

    const formattedPrompt = PROMPT.replace("{message}", prompt);

    const result = await model.invoke([["user", formattedPrompt]]);

    const args = result.tool_calls?.[0].args as
      | z.infer<typeof schema>
      | undefined;
    const shouldIncludeUrlContents = args?.shouldIncludeUrlContents;

    if (!shouldIncludeUrlContents) {
      return undefined;
    }

    const urlContents = await Promise.all(urls.map(fetchUrlContents));

    let transformedPrompt = prompt;
    for (const { url, pageContent } of urlContents) {
      transformedPrompt = transformedPrompt.replace(
        url,
        `<page-contents url="${url}">
  ${pageContent}
  </page-contents>`
      );
    }

    return new HumanMessage({
      ...message,
      content: transformedPrompt,
    });
  } catch (e) {
    console.error("Failed to handle included URLs", e);
    return undefined;
  }
}

export const includeURLContents = traceable(includeURLContentsFunc, {
  name: "include_url_contents",
});
