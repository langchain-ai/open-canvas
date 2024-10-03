import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  if (
    !process.env.SUPABASE_SERVICE_ROLE_KEY ||
    !process.env.NEXT_PUBLIC_SUPABASE_URL
  ) {
    return new NextResponse(
      JSON.stringify({
        error:
          "SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL must be set",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Initialize Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const searchParams = req.nextUrl.searchParams;
  const userId = searchParams.get("userId");
  const assistantId = searchParams.get("assistantId");

  if (!userId || !assistantId) {
    return new NextResponse(
      JSON.stringify({ error: "Missing userId or assistantId" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    // Fetch the latest system rules
    const { data, error } = await supabase
      .from("user_rules")
      .select("system_rules")
      .eq("user_id", userId)
      .eq("assistant_id", assistantId)
      .limit(1)
      .single();

    if (error) {
      console.error("Error getting system rules:", {
        error,
      });
      return new NextResponse(
        JSON.stringify({ error: "Failed to get system rules." }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!data) {
      return new NextResponse(JSON.stringify({ error: "No rules found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new NextResponse(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching system rules:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to fetch system rules" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
