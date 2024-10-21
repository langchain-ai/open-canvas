import { useState } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function getUser() {
    const supabase = createSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUser(user);
    setLoading(false);
  }

  return {
    getUser,
    user,
    loading,
  };
}
