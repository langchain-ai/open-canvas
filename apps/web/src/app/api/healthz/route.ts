import { NextResponse } from "next/server";
import { LANGGRAPH_API_URL } from "../../../constants";

export async function GET() {
  try {
    const response: any = { ok: true };

    if (LANGGRAPH_API_URL) {
      try {
        // Using a cheap GET request to check upstream health
        const upstreamRes = await fetch(LANGGRAPH_API_URL, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        response.upstream = upstreamRes.ok ? "up" : "down";
      } catch {
        response.upstream = "down";
      }
    } else {
      response.upstream = "down";
    }

    return NextResponse.json(response, {
      status: 200,
      headers: { "Access-Control-Allow-Origin": "*",
                 "Cache-Control": "no-cache, no-store, must-revalidate" }
    });
  } catch (error) {
    console.error("Health check error:", error);
    return NextResponse.json({ ok: true, error: "Health check failed" }, {
      status: 200,
      headers: { "Access-Control-Allow-Origin": "*",
                 "Cache-Control": "no-cache, no-store, must-revalidate" }
    });
  }
}
