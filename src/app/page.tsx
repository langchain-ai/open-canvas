"use client";
import { Canvas } from "@/components/Canvas";
import { AuthProvider } from "../contexts/AuthContext";
import { useEffect } from "react";
import { addAssistantIdToUser } from "@/lib/supabase/add_assistant_id_to_user";

export default function Home() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    addAssistantIdToUser();
  }, []);

  return (
    <AuthProvider>
      <Canvas />
    </AuthProvider>
  );
}
