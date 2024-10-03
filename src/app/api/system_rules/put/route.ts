import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
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

  const { assistantId, userId, systemRules } = await req.json();

  if (!userId || !assistantId || !systemRules) {
    return new NextResponse(
      JSON.stringify({
        error: "Missing userId, assistantId, or an array of systemRules.",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    // Insert new row into user_rules table
    const { data, error } = await supabase
      .from("user_rules")
      .upsert(
        {
          user_id: userId,
          assistant_id: assistantId,
          system_rules: systemRules,
        },
        { onConflict: "user_id,assistant_id", ignoreDuplicates: false }
      )
      .select();

    if (error) {
      console.error("Error inserting system rules:", {
        error,
      });
      return new NextResponse(
        JSON.stringify({ error: "Failed to insert system rules." }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new NextResponse(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error inserting system rules:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to insert system rules." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
