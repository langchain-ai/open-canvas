import { User } from "@supabase/supabase-js";
import { createClient } from "./server";

export async function verifyUserAuthenticated(): Promise<User | undefined> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user || undefined;
}
