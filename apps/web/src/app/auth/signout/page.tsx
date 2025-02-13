"use client";

import { useEffect, useState } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();
  const [errorOccurred, setErrorOccurred] = useState(false);

  useEffect(() => {
    async function signOut() {
      const client = createSupabaseClient();
      const { error } = await client.auth.signOut();
      if (error) {
        setErrorOccurred(true);
      } else {
        router.push("/auth/login");
      }
    }
    signOut();
  }, []);

  return (
    <>
      {errorOccurred ? (
        <div>
          <h1>Sign out error</h1>
          <p>
            There was an error signing out. Please refresh the page to try
            again.
          </p>
        </div>
      ) : (
        <p>Signing out...</p>
      )}
    </>
  );
}
