import {
  ALL_MODEL_NAMES,
  ALL_MODELS,
  DEFAULT_MODEL_CONFIG,
  DEFAULT_MODEL_NAME,
  HAS_EMPTY_THREADS_CLEARED_COOKIE,
  THREAD_ID_COOKIE_NAME,
} from "@/constants";
import { getCookie, setCookie } from "@/lib/cookies";
import { CustomModelConfig } from "@/types";
import { Thread } from "@langchain/langgraph-sdk";
import { useMemo, useState } from "react";
import { createClient } from "./utils";

export function useThread() {
  const [threadId, setThreadId] = useState<string>();
  const [userThreads, setUserThreads] = useState<Thread[]>([]);
  const [isUserThreadsLoading, setIsUserThreadsLoading] = useState(false);
  const [modelName, setModelName] =
    useState<ALL_MODEL_NAMES>(DEFAULT_MODEL_NAME);

  const [modelConfigs, setModelConfigs] = useState<
    Record<ALL_MODEL_NAMES, CustomModelConfig>
  >(() => {
    // Initialize with default configs for all models
    const initialConfigs: Record<ALL_MODEL_NAMES, CustomModelConfig> =
      {} as Record<ALL_MODEL_NAMES, CustomModelConfig>;

    ALL_MODELS.forEach((model) => {
      const modelKey = model.modelName || model.name;

      initialConfigs[modelKey] = {
        ...model.config,
        provider: model.config.provider,
        temperatureRange: {
          ...(model.config.temperatureRange ||
            DEFAULT_MODEL_CONFIG.temperatureRange),
        },
        maxTokens: {
          ...(model.config.maxTokens || DEFAULT_MODEL_CONFIG.maxTokens),
        },
        ...(model.config.provider === "azure_openai" && {
          azureConfig: {
            azureOpenAIApiKey: process.env._AZURE_OPENAI_API_KEY || "",
            azureOpenAIApiInstanceName:
              process.env._AZURE_OPENAI_API_INSTANCE_NAME || "",
            azureOpenAIApiDeploymentName:
              process.env._AZURE_OPENAI_API_DEPLOYMENT_NAME || "",
            azureOpenAIApiVersion:
              process.env._AZURE_OPENAI_API_VERSION || "2024-08-01-preview",
            azureOpenAIBasePath: process.env._AZURE_OPENAI_API_BASE_PATH,
          },
        }),
      };
    });
    return initialConfigs;
  });

  const modelConfig = useMemo(() => {
    // Try exact match first, then try without azure/ prefix
    return (
      modelConfigs[modelName] || modelConfigs[modelName.replace("azure/", "")]
    );
  }, [modelName, modelConfigs]);

  const setModelConfig = (
    modelName: ALL_MODEL_NAMES,
    config: CustomModelConfig
  ) => {
    setModelConfigs((prevConfigs) => ({
      ...prevConfigs,
      [modelName]: {
        ...config,
        provider: config.provider,
        temperatureRange: {
          ...(config.temperatureRange || DEFAULT_MODEL_CONFIG.temperatureRange),
        },
        maxTokens: {
          ...(config.maxTokens || DEFAULT_MODEL_CONFIG.maxTokens),
        },
        ...(config.provider === "azure_openai" && {
          azureConfig: {
            ...config.azureConfig,
            azureOpenAIApiKey:
              config.azureConfig?.azureOpenAIApiKey ||
              process.env._AZURE_OPENAI_API_KEY ||
              "",
            azureOpenAIApiInstanceName:
              config.azureConfig?.azureOpenAIApiInstanceName ||
              process.env._AZURE_OPENAI_API_INSTANCE_NAME ||
              "",
            azureOpenAIApiDeploymentName:
              config.azureConfig?.azureOpenAIApiDeploymentName ||
              process.env._AZURE_OPENAI_API_DEPLOYMENT_NAME ||
              "",
            azureOpenAIApiVersion:
              config.azureConfig?.azureOpenAIApiVersion || "2024-08-01-preview",
            azureOpenAIBasePath:
              config.azureConfig?.azureOpenAIBasePath ||
              process.env._AZURE_OPENAI_API_BASE_PATH,
          },
        }),
      },
    }));
  };

  const createThread = async (
    customModelName: ALL_MODEL_NAMES = DEFAULT_MODEL_NAME,
    customModelConfig: CustomModelConfig = modelConfig,
    userId: string
  ): Promise<Thread | undefined> => {
    const client = createClient();

    try {
      const thread = await client.threads.create({
        metadata: {
          supabase_user_id: userId,
          customModelName,
          modelConfig: {
            ...customModelConfig,
            // Ensure Azure config is included if needed
            ...(customModelConfig.provider === "azure_openai" && {
              azureConfig: customModelConfig.azureConfig,
            }),
          },
        },
      });
      setThreadId(thread.thread_id);
      setCookie(THREAD_ID_COOKIE_NAME, thread.thread_id);
      setModelName(customModelName);
      console.log("setting model config", customModelConfig);
      setModelConfig(customModelName, customModelConfig);
      await getUserThreads(userId);
      return thread;
    } catch (e) {
      console.error("Failed to create thread", e);
    }
  };

  const getUserThreads = async (userId: string) => {
    setIsUserThreadsLoading(true);
    try {
      const client = createClient();

      const userThreads = await client.threads.search({
        metadata: {
          supabase_user_id: userId,
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

  const searchOrCreateThread = async (userId: string) => {
    const threadIdCookie = getCookie(THREAD_ID_COOKIE_NAME);
    if (!threadIdCookie) {
      await createThread(modelName, modelConfig, userId);
      return;
    }

    // Thread ID is in cookies.
    const thread = await getThreadById(threadIdCookie);
    if (
      thread &&
      (!thread?.values || Object.keys(thread.values).length === 0)
    ) {
      // No values = no activity. Can keep.
      setThreadId(threadIdCookie);
      return threadIdCookie;
    } else {
      // Current thread has activity. Create a new thread.
      await createThread(modelName, modelConfig, userId);
      return;
    }
  };

  const clearThreadsWithNoValues = async (userId: string) => {
    const hasBeenClearedCookie = getCookie(HAS_EMPTY_THREADS_CLEARED_COOKIE);
    if (hasBeenClearedCookie === "true") {
      return;
    }

    const client = createClient();
    const processedThreadIds = new Set<string>();

    const fetchAndDeleteThreads = async (offset = 0) => {
      const userThreads = await client.threads.search({
        metadata: {
          supabase_user_id: userId,
        },
        limit: 100,
        offset: offset,
      });

      const threadsToDelete = userThreads.filter(
        (thread) =>
          !thread.values &&
          thread.thread_id !== threadId &&
          !processedThreadIds.has(thread.thread_id)
      );

      if (threadsToDelete.length > 0) {
        const deleteBatch = async (threadIds: string[]) => {
          await Promise.all(
            threadIds.map(async (threadId) => {
              await client.threads.delete(threadId);
              processedThreadIds.add(threadId);
            })
          );
        };

        // Create an array of unique thread IDs
        const uniqueThreadIds = Array.from(
          new Set(threadsToDelete.map((thread) => thread.thread_id))
        );

        // Process unique thread IDs in batches of 10
        for (let i = 0; i < uniqueThreadIds.length; i += 10) {
          try {
            await deleteBatch(uniqueThreadIds.slice(i, i + 10));
          } catch (e) {
            console.error("Error deleting threads", e);
          }
        }
      }

      if (userThreads.length === 100) {
        // If we got 100 threads, there might be more, so continue fetching
        await fetchAndDeleteThreads(offset + 100);
      }
    };

    try {
      await fetchAndDeleteThreads();
      setCookie(HAS_EMPTY_THREADS_CLEARED_COOKIE, "true");
    } catch (e) {
      console.error("Error fetching & deleting threads", e);
    }
  };

  const getThreadById = async (id: string): Promise<Thread | undefined> => {
    try {
      const client = createClient();
      const thread = await client.threads.get(id);
      if (thread.metadata && thread.metadata.customModelName) {
        if (thread.metadata.customModelName) {
          setModelName(thread.metadata.customModelName as ALL_MODEL_NAMES);
        } else {
          setModelName(DEFAULT_MODEL_NAME);
        }

        if (thread.metadata.modelConfig) {
          setModelConfig(
            thread.metadata.customModelName as ALL_MODEL_NAMES,
            thread.metadata.modelConfig as CustomModelConfig
          );
        } else {
          setModelConfig(DEFAULT_MODEL_NAME, DEFAULT_MODEL_CONFIG);
        }
      }
      return thread;
    } catch (e) {
      console.error(`Failed to get thread with ID ${id}`, e);
    }
  };

  const deleteThread = async (
    id: string,
    userId: string,
    clearMessages: () => void
  ) => {
    setUserThreads((prevThreads) => {
      const newThreads = prevThreads.filter(
        (thread) => thread.thread_id !== id
      );
      return newThreads;
    });
    if (id === threadId) {
      clearMessages();
      // Create a new thread. Use .then to avoid blocking the UI.
      // Once completed, `createThread` will re-fetch all user
      // threads to update UI.
      void createThread(modelName, modelConfig, userId);
    }
    const client = createClient();
    try {
      await client.threads.delete(id);
    } catch (e) {
      console.error(`Failed to delete thread with ID ${id}`, e);
    }
  };

  return {
    threadId,
    userThreads,
    isUserThreadsLoading,
    modelName,
    modelConfig,
    modelConfigs,
    createThread,
    clearThreadsWithNoValues,
    searchOrCreateThread,
    getUserThreads,
    deleteThread,
    getThreadById,
    setThreadId,
    setModelName,
    setModelConfig,
  };
}
