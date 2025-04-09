import { LANGGRAPH_API_URL } from "@/constants";
import { createSupabaseClient } from "@/lib/supabase/client";
import { Client } from "@langchain/langgraph-sdk";
import { Session } from "@supabase/supabase-js";

export const createClient = async (session?: Session) => {
  let bearerToken: string | undefined = session?.access_token;

  if (!bearerToken) {
    const supabaseClient = createSupabaseClient();
    const {
      data: { session },
    } = await supabaseClient.auth.getSession();
    bearerToken = session?.access_token;
  }
  if (!bearerToken) {
    throw new Error("Failed to access JWT token.");
  }

  return new Client({
    apiUrl: LANGGRAPH_API_URL,
    defaultHeaders: { Authorization: `Bearer ${bearerToken}` },
  });
};
