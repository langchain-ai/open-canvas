import { User } from "@supabase/supabase-js";
import { createClient } from "./server";
import { isAuthEnabled } from "../auth-config";

export async function verifyUserAuthenticated(): Promise<User | undefined> {
  if (!isAuthEnabled()) {
    // Return a mock user when auth is disabled
    return {
      id: 'anonymous',
      email: 'anonymous@example.com',
      // Add other required User properties
    } as User;
  }

  const supabase = createClient();
  if (!supabase) return undefined;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user || undefined;
}