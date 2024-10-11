import { NextRequest, NextResponse } from "next/server";
import { Client } from "@langchain/langgraph-sdk";
import { LANGGRAPH_API_URL } from "@/constants";

export async function POST(req: NextRequest) {
  const { assistantId } = await req.json();

  if (!assistantId) {
    return new NextResponse(
      JSON.stringify({
        error: "`assistantId` is required to fetch stored data.",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const lgClient = new Client({
    apiKey: process.env.LANGCHAIN_API_KEY,
    apiUrl: LANGGRAPH_API_URL,
  });

  const memoryNamespace = ["memories", assistantId];
  const memoryKey = "reflection";

  try {
    await lgClient.store.deleteItem(memoryNamespace, memoryKey);

    return new NextResponse(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new NextResponse(
      JSON.stringify({ error: "Failed to share run after multiple attempts." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
