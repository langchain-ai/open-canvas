"use client";
import { useEffect } from "react";
import { addAssistantIdToUser } from "@/lib/supabase/add_assistant_id_to_user";
import { CanvasLoading, Canvas } from "@/components/canvas";
import { useUser } from "@/hooks/useUser";
import { useThread } from "@/hooks/useThread";

export default function Home() {
  const { user, getUser } = useUser();
  const { threadId, assistantId, searchOrCreateThread, getOrCreateAssistant } =
    useThread();

  useEffect(() => {
    getUser();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!user) return;

    if (!threadId) {
      searchOrCreateThread(user.id);
    }

    if (!assistantId) {
      getOrCreateAssistant();
    }
  }, [user]);

  useEffect(() => {
    if (typeof window === "undefined" || !user) return;
    addAssistantIdToUser();
  }, [user]);

  if (!user || !assistantId || !threadId) {
    return <CanvasLoading />;
  }

  return <Canvas threadId={threadId} assistantId={assistantId} user={user} />;
}
