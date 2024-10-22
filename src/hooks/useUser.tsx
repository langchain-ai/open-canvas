import { useState } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

export function useUser() {
  const [user, setUser] = useState<User>();
  const [loading, setLoading] = useState(true);

  async function getUser() {
    const supabase = createSupabaseClient();

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
