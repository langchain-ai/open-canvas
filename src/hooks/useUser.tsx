import { useState } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { isAuthEnabled } from "@/lib/auth-config";

export function useUser() {
  const [user, setUser] = useState<User>();
  const [loading, setLoading] = useState(true);

  async function getUser() {
    if (!isAuthEnabled()) {
      const mockUser = {
        id: 'anonymous',
        email: 'anonymous@example.com',
        // Add other required User properties
      } as User;
      setUser(mockUser);
      setLoading(false);
      return;
    }

    const supabase = createSupabaseClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUser(user || undefined);
    setLoading(false);
  }

  return {
    getUser,
    user,
    loading,
  };
}