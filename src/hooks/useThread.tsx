import { useEffect, useState } from "react";
import { createClient } from "./utils";
import { getCookie, setCookie } from "@/lib/cookies";
import { ASSISTANT_ID_COOKIE } from "@/constants";

export function useThread(userId: string) {
  const [assistantId, setAssistantId] = useState<string>();
  const [threadId, setThreadId] = useState<string>();

  useEffect(() => {
    if (threadId || typeof window === "undefined") return;
    createThread();
  }, []);

  useEffect(() => {
    if (assistantId || typeof window === "undefined") return;
    getOrCreateAssistant();
  }, []);

  const createThread = async (clearState?: () => void) => {
    clearState?.();
    const client = createClient();
    const thread = await client.threads.create({
      metadata: {
        supabase_user_id: userId,
      },
    });
    setThreadId(thread.thread_id);
    return thread;
  };

  const getOrCreateAssistant = async () => {
    const assistantIdCookie = getCookie(ASSISTANT_ID_COOKIE);
    if (assistantIdCookie) {
      setAssistantId(assistantIdCookie);
      return;
    }
    const client = createClient();
    const assistant = await client.assistants.create({
      graphId: "agent",
    });
    setAssistantId(assistant.assistant_id);
    setCookie(ASSISTANT_ID_COOKIE, assistant.assistant_id);
  };

  return {
    threadId,
    assistantId,
    createThread,
  };
}
