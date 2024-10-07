import { NextRequest, NextResponse } from "next/server";
import { Client } from "langsmith";

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

  try {
    const sharedRunURL = await lsClient.shareRun(runId);

    return new NextResponse(JSON.stringify({ sharedRunURL }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(`Failed to share run with id ${runId}:\n`, error);
    return new NextResponse(JSON.stringify({ error: "Failed to share run." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
