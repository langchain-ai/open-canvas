import { LANGGRAPH_API_URL } from "@/constants";
import { createSupabaseClient } from "@/lib/supabase/client";
import { Client } from "@langchain/langgraph-sdk";

export const createClient = async () => {
  const supabaseClient = createSupabaseClient();
  const jwtToken = (await supabaseClient.auth.getSession()).data.session
    ?.access_token;
  // const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api";
  return new Client({
    apiUrl: LANGGRAPH_API_URL,
    defaultHeaders: { Authorization: `Bearer ${jwtToken}` },
  });
};
