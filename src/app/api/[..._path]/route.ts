import { LANGGRAPH_API_URL } from "../../../constants";
import { NextRequest, NextResponse } from "next/server";
import { User } from "@supabase/supabase-js";
import { verifyUserAuthenticated } from "../../../lib/supabase/verify_user_server";

function getCorsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "*",
  };
}

async function handleRequest(req: NextRequest, method: string) {
  let user: User | undefined;
  try {
    user = await verifyUserAuthenticated();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } catch (e) {
    console.error("Failed to fetch user", e);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const path = req.nextUrl.pathname.replace(/^\/?api\//, "");
    const url = new URL(req.url);
    const searchParams = new URLSearchParams(url.search);
    searchParams.delete("_path");
    searchParams.delete("nxtP_path");
    const queryString = searchParams.toString()
      ? `?${searchParams.toString()}`
      : "";

    const options: RequestInit = {
      method,
      headers: {
        "x-api-key": process.env.LANGCHAIN_API_KEY || "",
      },
    };

    if (["POST", "PUT", "PATCH"].includes(method)) {
      const bodyText = await req.text();

      if (typeof bodyText === "string" && bodyText.length > 0) {
        const parsedBody = JSON.parse(bodyText);
        parsedBody.config = parsedBody.config || {};
        parsedBody.config.configurable = {
          ...parsedBody.config.configurable,
          supabase_user_id: user.id,
        };
        options.body = JSON.stringify(parsedBody);
      } else {
        options.body = bodyText;
      }
    }

    const res = await fetch(
      `${LANGGRAPH_API_URL}/${path}${queryString}`,
      options
    );

    if (res.status >= 400) {
      console.error("ERROR IN PROXY", res.status, res.statusText);
      return new Response(res.body, {
        status: res.status,
        statusText: res.statusText,
      });
    }

    const headers = new Headers({
      ...getCorsHeaders(),
    });
    // Safely add headers from the original response
    res.headers.forEach((value, key) => {
      try {
        headers.set(key, value);
      } catch (error) {
        console.warn(`Failed to set header: ${key}`, error);
      }
    });

    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers,
    });
  } catch (e: any) {
    console.error("Error in proxy");
    console.error(e);
    console.error("\n\n\nEND ERROR\n\n");
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}

export const GET = (req: NextRequest) => handleRequest(req, "GET");
export const POST = (req: NextRequest) => handleRequest(req, "POST");
export const PUT = (req: NextRequest) => handleRequest(req, "PUT");
export const PATCH = (req: NextRequest) => handleRequest(req, "PATCH");
export const DELETE = (req: NextRequest) => handleRequest(req, "DELETE");

// Add a new OPTIONS handler
export const OPTIONS = () => {
  return new NextResponse(null, {
    status: 204,
    headers: {
      ...getCorsHeaders(),
    },
  });
};
