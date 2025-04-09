import { NextRequest, NextResponse } from "next/server";
import { Client } from "@langchain/langgraph-sdk";
import { LANGGRAPH_API_URL } from "@/constants";
import { verifyUserAuthenticated } from "../../../../lib/supabase/verify_user_server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const authRes = await verifyUserAuthenticated();
    if (!authRes?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } catch (e) {
    console.error("Failed to fetch user", e);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { namespace, key } = await req.json();

  const supabaseClient = createClient();
  const jwtToken = (await supabaseClient.auth.getSession()).data.session
    ?.access_token;
  const lgClient = new Client({
    apiUrl: LANGGRAPH_API_URL,
    defaultHeaders: { Authorization: `Bearer ${jwtToken}` },
  });

  const item = await lgClient.store.getItem(namespace, key);

  return new NextResponse(JSON.stringify({ item }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
