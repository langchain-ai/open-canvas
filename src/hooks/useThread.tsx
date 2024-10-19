import { useEffect, useState } from "react";
import { createClient } from "./utils";
import { getCookie, setCookie } from "@/lib/cookies";
import { ASSISTANT_ID_COOKIE } from "@/constants";
import { Thread } from "@langchain/langgraph-sdk";

export function useThread(userId: string) {
  const [assistantId, setAssistantId] = useState<string>();
  const [threadId, setThreadId] = useState<string>();
  const [userThreads, setUserThreads] = useState<Thread[]>([]);
  const [isUserThreadsLoading, setIsUserThreadsLoading] = useState(false);

  useEffect(() => {
    if (threadId || typeof window === "undefined") return;
    createThread();
  }, []);

  useEffect(() => {
    if (assistantId || typeof window === "undefined") return;
    getOrCreateAssistant();
  }, []);

  useEffect(() => {
    if (typeof window == "undefined" || !userId || userThreads.length) return;
    getUserThreads(userId);
  }, [userId]);

  const createThread = async (clearState?: () => void) => {
    clearState?.();
    const client = createClient();
    const thread = await client.threads.create({
      metadata: {
        supabase_user_id: userId,
      },
    });
    setThreadId(thread.thread_id);
    await getUserThreads(userId);
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

  const getUserThreads = async (id: string) => {
    setIsUserThreadsLoading(true);
    try {
      const client = createClient();

      const userThreads = await client.threads.search({
        metadata: {
          supabase_user_id: id,
        },
        limit: 100,
      });

      if (userThreads.length > 0) {
        const lastInArray = userThreads[0];
        const allButLast = userThreads.slice(1, userThreads.length);
        const filteredThreads = allButLast.filter(
          (thread) => thread.values && Object.keys(thread.values).length > 0
        );
        setUserThreads([...filteredThreads, lastInArray]);
      }
    } finally {
      setIsUserThreadsLoading(false);
    }
  };

  const getThreadById = async (id: string) => {
    const client = createClient();
    return await client.threads.get(id);
  };

  const deleteThread = async (id: string, clearMessages: () => void) => {
    if (!userId) {
      throw new Error("User ID not found");
    }
    setUserThreads((prevThreads) => {
      const newThreads = prevThreads.filter(
        (thread) => thread.thread_id !== id
      );
      return newThreads;
    });
    if (id === threadId) {
      clearMessages();
      // Create a new thread. Use .then to avoid blocking the UI.
      // Once completed re-fetch threads to update UI.
      createThread().then(async () => {
        await getUserThreads(userId);
      });
    }
    const client = createClient();
    await client.threads.delete(id);
  };

  return {
    threadId,
    assistantId,
    createThread,
    getUserThreads,
    userThreads,
    isUserThreadsLoading,
    deleteThread,
    getThreadById,
    setThreadId,
  };
}
