// Remove supabase_user_id from metadata
const thread = await client.threads.create({
  metadata: {
    customModelName: modelName,
    modelConfig: {
      ...modelConfig,
      // Ensure Azure config is included if needed
      ...(modelConfig.provider === "azure_openai" && {
        azureConfig: modelConfig.azureConfig,
      }),
    },
  },
});

// Similarly, remove supabase_user_id from search metadata
const userThreads = await client.threads.search({
  metadata: {},
  limit: 100,
});
