import { Assistant } from "@langchain/langgraph-sdk";
import { useState } from "react";
import { useToast } from "./use-toast";
import { createClient } from "./utils";
import { ASSISTANT_ID_COOKIE } from "@/constants";
import { getCookie, removeCookie } from "@/lib/cookies";

export type AssistantTool = {
  /**
   * The name of the tool
   */
  name: string;
  /**
   * The tool's description.
   */
  description: string;
  /**
   * JSON Schema for the parameters of the tool.
   */
  parameters: Record<string, any>;
};

export interface CreateAssistantFields {
  iconData?: {
    /**
     * The name of the Lucide icon to use for the assistant.
     * @default "User"
     */
    iconName: string;
    /**
     * The hex color code to use for the icon.
     */
    iconColor: string;
  };
  /**
   * The name of the assistant.
   */
  name: string;
  /**
   * An optional description of the assistant, provided by the user/
   */
  description?: string;
  /**
   * The tools the assistant has access to.
   */
  tools?: Array<AssistantTool>;
  /**
   * An optional system prompt to prefix all generations with.
   */
  systemPrompt?: string;
  is_default?: boolean;
}

export function useAssistants() {
  const { toast } = useToast();
  const [isLoadingAllAssistants, setIsLoadingAllAssistants] = useState(false);
  const [isDeletingAssistant, setIsDeletingAssistant] = useState(false);
  const [isCreatingAssistant, setIsCreatingAssistant] = useState(false);
  const [isEditingAssistant, setIsEditingAssistant] = useState(false);
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [selectedAssistant, setSelectedAssistant] = useState<Assistant>();

  const getAssistants = async (userId: string): Promise<void> => {
    setIsLoadingAllAssistants(true);
    try {
      const client = createClient();
      const response = await client.assistants.search({
        metadata: {
          user_id: userId,
        },
      });

      setAssistants({
        ...response,
      });
      setIsLoadingAllAssistants(false);
    } catch (e) {
      toast({
        title: "Failed to get assistants",
        description: "Please try again later.",
      });
      console.error("Failed to get assistants", e);
      setIsLoadingAllAssistants(false);
    }
  };

  const deleteAssistant = async (assistantId: string): Promise<boolean> => {
    setIsDeletingAssistant(true);
    try {
      const client = createClient();
      await client.assistants.delete(assistantId);

      if (selectedAssistant?.assistant_id === assistantId) {
        // Get the first assistant in the list to set as
        const defaultAssistant =
          assistants.find((a) => a.metadata?.is_default) || assistants[0];
        setSelectedAssistant(defaultAssistant);
      }

      setAssistants((prev) =>
        prev.filter((assistant) => assistant.assistant_id !== assistantId)
      );
      setIsDeletingAssistant(false);
      return true;
    } catch (e) {
      toast({
        title: "Failed to delete assistant",
        description: "Please try again later.",
      });
      console.error("Failed to delete assistant", e);
      setIsDeletingAssistant(false);
      return false;
    }
  };

  const createCustomAssistant = async (
    newAssistant: CreateAssistantFields,
    userId: string,
    successCallback?: (id: string) => void
  ): Promise<boolean> => {
    setIsCreatingAssistant(true);
    try {
      const client = createClient();
      const { tools, systemPrompt, name, ...metadata } = newAssistant;
      const createdAssistant = await client.assistants.create({
        graphId: "agent",
        name,
        metadata: {
          user_id: userId,
          ...metadata,
        },
        config: {
          configurable: {
            tools,
            systemPrompt,
          },
        },
        ifExists: "do_nothing",
      });

      setAssistants((prev) => [...prev, createdAssistant]);
      setSelectedAssistant(createdAssistant);
      successCallback?.(createdAssistant.assistant_id);
      setIsCreatingAssistant(false);
      return true;
    } catch (e) {
      toast({
        title: "Failed to create assistant",
        description: "Please try again later.",
      });
      setIsCreatingAssistant(false);
      console.error("Failed to create an assistant", e);
      return false;
    }
  };

  const editCustomAssistant = async (
    editedAssistant: CreateAssistantFields,
    assistantId: string,
    userId: string
  ): Promise<Assistant | undefined> => {
    setIsEditingAssistant(true);
    try {
      const client = createClient();
      const { tools, systemPrompt, name, ...metadata } = editedAssistant;
      const response = await client.assistants.update(assistantId, {
        name,
        graphId: "agent",
        metadata: {
          user_id: userId,
          ...metadata,
        },
        config: {
          configurable: {
            tools,
            systemPrompt,
          },
        },
      });

      setAssistants((prev) =>
        prev.map((assistant) => {
          if (assistant.assistant_id === assistantId) {
            return response;
          }
          return assistant;
        })
      );
      setIsEditingAssistant(false);
      return response;
    } catch (e) {
      console.error("Failed to edit assistant", e);
      setIsEditingAssistant(false);
      return undefined;
    }
  };

  /**
   * Legacy function which gets the assistant and updates it's metadata. Then, it deletes the assistant ID cookie
   * to ensure this function does not run again.
   */
  const legacyGetAndUpdateAssistant = async (
    userId: string,
    assistantIdCookie: string
  ) => {
    const updatedAssistant = await editCustomAssistant(
      {
        is_default: true,
        iconData: {
          iconName: "User",
          iconColor: "#000000",
        },
        description: "Your default assistant.",
        name: "Default assistant",
        tools: undefined,
        systemPrompt: undefined,
      },
      assistantIdCookie,
      userId
    );

    if (!updatedAssistant) {
      const ghIssueTitle = "Failed to set default assistant";
      const ghIssueBody = `Failed to set the default assistant for user.\n\nDate: '${new Date().toISOString()}'`;
      const assignee = "bracesproul";
      const queryParams = new URLSearchParams({
        title: ghIssueTitle,
        body: ghIssueBody,
        assignee,
        "labels[]": "autogenerated",
      });
      const newIssueURL = `https://github.com/langchain-ai/open-canvas/issues/new?${queryParams.toString()}`;

      toast({
        title: "Failed to edit assistant",
        description: (
          <p>
            Please open an issue{" "}
            <a href={newIssueURL} target="_blank">
              here
            </a>{" "}
            (do <i>not</i> edit fields) and try again later.
          </p>
        ),
      });
      return;
    }

    setSelectedAssistant(updatedAssistant);
    setAssistants([updatedAssistant]);
    // Remove the cookie to ensure this is not called again.
    removeCookie(ASSISTANT_ID_COOKIE);
  };

  const getOrCreateAssistant = async (userId: string) => {
    if (selectedAssistant) {
      return;
    }
    setIsLoadingAllAssistants(true);
    const client = createClient();
    let userAssistants: Assistant[] = [];

    const assistantIdCookie = getCookie(ASSISTANT_ID_COOKIE);
    if (assistantIdCookie) {
      await legacyGetAndUpdateAssistant(userId, assistantIdCookie);
      // Return early because this function will set the selected assistant and assistants state.
      setIsLoadingAllAssistants(false);
      return;
    }

    // No cookie found. First, search for all assistants under the user's ID
    try {
      userAssistants = await client.assistants.search({
        graphId: "agent",
        metadata: {
          user_id: userId,
        },
        limit: 100,
      });
    } catch (e) {
      console.error("Failed to get default assistant", e);
    }

    if (!userAssistants.length) {
      // No assistants found, create a new assistant and set it as the default.
      await createCustomAssistant(
        {
          iconData: {
            iconName: "User",
            iconColor: "#000000",
          },
          name: "Default assistant",
          description: "Your default assistant.",
          is_default: true,
        },
        userId
      );

      // Return early because this function will set the selected assistant and assistants state.
      setIsLoadingAllAssistants(false);
      return;
    }

    setAssistants(userAssistants);

    const defaultAssistant = userAssistants.find(
      (assistant) => assistant.metadata?.is_default
    );
    if (!defaultAssistant) {
      // Update the first assistant to be the default assistant, then set it as the selected assistant.
      const firstAssistant = userAssistants.sort((a, b) => {
        return a.created_at.localeCompare(b.created_at);
      })[0];
      const updatedAssistant = await editCustomAssistant(
        {
          is_default: true,
          iconData: {
            iconName:
              (firstAssistant.metadata?.iconName as string | undefined) ||
              "User",
            iconColor:
              (firstAssistant.metadata?.iconColor as string | undefined) ||
              "#000000",
          },
          description:
            (firstAssistant.metadata?.description as string | undefined) ||
            "Your default assistant.",
          name:
            firstAssistant.name.toLowerCase() === "Untitled"
              ? "Default assistant"
              : firstAssistant.name,
          tools:
            (firstAssistant.config?.configurable?.tools as
              | AssistantTool[]
              | undefined) || undefined,
          systemPrompt:
            (firstAssistant.config?.configurable?.systemPrompt as
              | string
              | undefined) || undefined,
        },
        firstAssistant.assistant_id,
        userId
      );

      setSelectedAssistant(updatedAssistant);
    } else {
      setSelectedAssistant(defaultAssistant);
    }

    setIsLoadingAllAssistants(false);
  };

  return {
    assistants,
    selectedAssistant,
    isLoadingAllAssistants,
    isDeletingAssistant,
    isCreatingAssistant,
    isEditingAssistant,
    getOrCreateAssistant,
    getAssistants,
    deleteAssistant,
    createCustomAssistant,
    editCustomAssistant,
    setSelectedAssistant,
  };
}
