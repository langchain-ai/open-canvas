"use client";
import { WelcomeDialog } from "@/components/WelcomeDialog";
import { useState } from "react";
import { useRules } from "@/hooks/useRules";
import { GeneratedRulesDialog } from "@/components/GeneratedRulesDialog";
import { ContentComposerChatInterface } from "@/components/ContentComposer";
import { useGraph } from "@/hooks/useGraph";
import { SystemRulesDialog } from "@/components/SystemRulesDialog";
import { useUser } from "@/hooks/useUser";
import { AssistantsDropdown } from "@/components/AssistantsDropdown";

export default function Home() {
  const [refreshAssistants, setRefreshAssistants] = useState<
    () => Promise<void>
  >(() => () => Promise.resolve());
  const { userId } = useUser();
  const {
    createAssistant,
    sendMessage,
    streamMessage,
    assistantId,
    setAssistantId,
    isGetAssistantsLoading,
    getAssistantsByUserId,
    updateAssistantMetadata,
  } = useGraph({ userId, refreshAssistants });
  const {
    userRules,
    isLoadingUserRules,
    setSystemRules,
    systemRules,
    setSystemRulesAndSave,
    isLoadingSystemRules,
    getUserRules,
  } = useRules({ assistantId, userId });

  return (
    <main className="h-screen">
      <AssistantsDropdown
        createAssistant={createAssistant}
        selectedAssistantId={assistantId}
        isGetAssistantsLoading={isGetAssistantsLoading}
        getAssistantsByUserId={getAssistantsByUserId}
        setAssistantId={setAssistantId}
        userId={userId}
        onAssistantUpdate={(callback: () => Promise<void>) =>
          setRefreshAssistants(() => callback)
        }
      />
      <GeneratedRulesDialog
        isLoadingUserRules={isLoadingUserRules}
        userRules={userRules}
      />
      <SystemRulesDialog
        setSystemRules={setSystemRules}
        setSystemRulesAndSave={setSystemRulesAndSave}
        isLoadingSystemRules={isLoadingSystemRules}
        systemRules={systemRules}
      />
      <ContentComposerChatInterface
        createAssistant={createAssistant}
        systemRules={systemRules}
        sendMessage={async (params) => sendMessage(params, getUserRules)}
        streamMessage={streamMessage}
        userId={userId}
      />
      <WelcomeDialog
        setSystemRules={setSystemRules}
        setSystemRulesAndSave={setSystemRulesAndSave}
        isLoadingSystemRules={isLoadingSystemRules}
        systemRules={systemRules}
        updateAssistantMetadata={updateAssistantMetadata}
        assistantId={assistantId}
        userId={userId}
      />
    </main>
  );
}
