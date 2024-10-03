import { Client } from "@langchain/langgraph-sdk";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  if (!process.env.LANGGRAPH_API_URL || !process.env.LANGCHAIN_API_KEY) {
    return new NextResponse(
      JSON.stringify({
        error: "LANGGRAPH_API_URL and LANGCHAIN_API_KEY must be set",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const searchParams = req.nextUrl.searchParams;
  const namespaceParam = searchParams.get("namespace");
  const key = searchParams.get("key");

  if (!namespaceParam || !key) {
    return new NextResponse(
      JSON.stringify({ error: "Missing namespace or key" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Parse the namespace from URL-encoded string to an array of strings
  const namespace: string = decodeURIComponent(namespaceParam);
  const namespaceArr: string[] = namespace.split(".");

  if (!Array.isArray(namespaceArr)) {
    return new NextResponse(
      JSON.stringify({ error: "Invalid namespace format" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const lgClient = new Client({
    apiKey: process.env.LANGCHAIN_API_KEY,
    apiUrl: process.env.LANGGRAPH_API_URL,
  });

  try {
    const result = await lgClient.store.getItem(namespaceArr, key);

    return new NextResponse(JSON.stringify(result ?? {}), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Err fetching store");
    console.error(e);
    return new NextResponse(
      JSON.stringify({ error: "Failed to get item from store" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
