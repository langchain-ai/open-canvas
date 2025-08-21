import { createClient } from "@/hooks/utils";

const modelName = "litellm-ollama-phi3"; // Example model name
const modelConfig = {
  provider: "ollama",
  temperatureRange: {
    min: 0,
    max: 2,
    default: 0.7,
    current: 0.7,
  },
  maxTokens: {
    min: 1,
    max: 2048,
    default: 512,
    current: 512,
  },
}; // Example model config

const ThreadProvider = async () => {
  const client = createClient();

  // Remove supabase_user_id from metadata
  const thread = await client.threads.create({
    metadata: {
      customModelName: modelName,
      modelConfig,
    },
  });

  // Similarly, remove supabase_user_id from search metadata
  const userThreads = await client.threads.search({
    metadata: {},
    limit: 100,
  });

  // Further implementation...
};

export default ThreadProvider;
