import { NextRequest, NextResponse } from "next/server";
import { Client } from "langsmith";

const MAX_RETRIES = 5;
const RETRY_DELAY = 5000; // 5 seconds

async function shareRunWithRetry(
  lsClient: Client,
  runId: string
): Promise<string> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await lsClient.shareRun(runId);
    } catch (error) {
      if (attempt === MAX_RETRIES) {
        throw error;
      }
      console.warn(
        `Attempt ${attempt} failed. Retrying in ${RETRY_DELAY / 1000} seconds...`
      );
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
    }
  }
  throw new Error("Max retries reached"); // This line should never be reached due to the throw in the loop
}

export async function POST(req: NextRequest) {
  const { runId } = await req.json();

  if (!runId) {
    return new NextResponse(
      JSON.stringify({
        error: "`runId` is required to share run.",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const lsClient = new Client({
    apiKey: process.env.LANGCHAIN_API_KEY,
  });

  const sharedRunURL = await shareRunWithRetry(lsClient, runId);

  return new NextResponse(JSON.stringify({ sharedRunURL }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
