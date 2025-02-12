import { ALL_MODEL_NAMES } from "@opencanvas/shared/models";
import { CustomModelConfig, GraphInput } from "@opencanvas/shared/types";

export interface StreamWorkerMessage {
  type: "chunk" | "done" | "error";
  data?: string;
  error?: string;
}

export interface StreamConfig {
  threadId: string;
  assistantId: string;
  input: GraphInput;
  modelName: ALL_MODEL_NAMES;
  modelConfigs: Record<string, CustomModelConfig>;
}
