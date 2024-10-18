"use client";
import { Canvas } from "@/components/Canvas";
import { useEffect } from "react";
import { addAssistantIdToUser } from "@/lib/supabase/add_assistant_id_to_user";
import { CanvasLoading } from "@/components/CanvasLoading";
import { useUser } from "@/hooks/useUser";

export default function Home() {
  const { user } = useUser();

  useEffect(() => {
    if (typeof window === "undefined" || !user) return;
    addAssistantIdToUser();
  }, [user]);

  if (!user) {
    return <CanvasLoading />;
  }

  return <Canvas user={user} />;
}
