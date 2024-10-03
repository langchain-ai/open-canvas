import { ChatAnthropic } from "@langchain/anthropic";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { messages } = await req.json();
  if (!messages || !messages.length) {
    return new NextResponse("Missing messages", { status: 400 });
  }

  const model = new ChatAnthropic({
    model: "claude-3-haiku-20240307",
    temperature: 0.5,
  });
  const stream = await model.stream(messages);

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        console.log("Encoding ", chunk);
        const bytes = encoder.encode(JSON.stringify(chunk));
        controller.enqueue(bytes);
      }
      controller.close();
    },
  });

  return new NextResponse(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
