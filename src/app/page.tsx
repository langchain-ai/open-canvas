"use client";
import { Canvas } from "@/components/Canvas";
import { useEffect } from "react";
import { addAssistantIdToUser } from "@/lib/supabase/add_assistant_id_to_user";
import { CanvasLoading } from "@/components/CanvasLoading";
import { useUser } from "@/hooks/useUser";
import { isAuthEnabled } from "@/lib/auth-config";

export default function Home() {
  const { user, getUser } = useUser();

  useEffect(() => {
    if (isAuthEnabled()) {
      getUser();
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !user) return;
    if (isAuthEnabled()) {
      addAssistantIdToUser();
    }
  }, [user]);

  // If auth is disabled, render Canvas directly with mock user
  if (!isAuthEnabled()) {
    return <Canvas user={{ id: 'anonymous' } as any} />;
  }

  // Otherwise, show loading until user is loaded
  if (!user) {
    return <CanvasLoading />;
  }

  return <Canvas user={user} />;
}