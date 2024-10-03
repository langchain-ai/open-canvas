import { type Assistant } from "@langchain/langgraph-sdk";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Loader } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { NewAssistantDialog } from "./NewAssistantDialog";

export interface AssistantsDropdownProps {
  selectedAssistantId: string | undefined;
  isGetAssistantsLoading: boolean;
  getAssistantsByUserId: (userId: string) => Promise<Assistant[]>;
  setAssistantId: (assistantId: string) => void;
  userId: string | undefined;
  createAssistant: (
    graphId: string,
    userId: string,
    extra?: {
      assistantName?: string;
      assistantDescription?: string;
      overrideExisting?: boolean;
    }
  ) => Promise<Assistant | undefined>;
  onAssistantUpdate: (callback: () => Promise<void>) => void;
}

export function AssistantsDropdown(props: AssistantsDropdownProps) {
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [selectedAssistant, setSelectedAssistant] = useState<Assistant | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  const fetchAssistants = useCallback(async () => {
    if (!props.userId || !props.selectedAssistantId) return;
    setIsLoading(true);
    let assistants = await props.getAssistantsByUserId(props.userId);
    if (props.selectedAssistantId) {
      const currentSelectedAssistant = assistants.find(
        (a) => a.assistant_id === props.selectedAssistantId
      );

      if (currentSelectedAssistant) {
        const otherAssistants = assistants.filter(
          (a) => a.assistant_id !== props.selectedAssistantId
        );
        assistants = [currentSelectedAssistant, ...otherAssistants];
        setSelectedAssistant(currentSelectedAssistant);
      }
    }
    setAssistants(assistants);
    setIsLoading(false);
  }, [props.userId, props.selectedAssistantId]);

  useEffect(() => {
    if (!props.userId || assistants.length > 0) {
      setIsLoading(false);
    }
    void fetchAssistants();
  }, [props.userId, props.selectedAssistantId, assistants.length]);

  useEffect(() => {
    props.onAssistantUpdate(fetchAssistants);
  }, [props.onAssistantUpdate]);

  const handleChangeAssistant = (assistantId: string) => {
    if (assistantId === props.selectedAssistantId) return;

    props.setAssistantId(assistantId);
    // Force page reload
    window.location.reload();
  };

  const defaultButtonValue = isLoading ? (
    <p className="flex items-center text-sm text-gray-600 p-2">
      Loading assistants
      <Loader className="ml-2 h-4 w-4 animate-spin" />
    </p>
  ) : (
    "Select assistant"
  );

  return (
    <div className="fixed top-4 left-4 z-50">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            {selectedAssistant?.metadata?.assistantName
              ? (selectedAssistant.metadata.assistantName as string)
              : defaultButtonValue}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="min-w-64 ml-4">
          <DropdownMenuLabel>Assistants</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup
            value={selectedAssistant?.assistant_id}
            onValueChange={handleChangeAssistant}
            className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
          >
            {props.isGetAssistantsLoading ? (
              <p className="flex items-center text-sm text-gray-600 p-2">
                Fetching assistants
                <Loader className="ml-2 h-4 w-4 animate-spin" />
              </p>
            ) : assistants.length ? (
              assistants.map((assistant, idx) => {
                const assistantName =
                  (assistant.metadata?.assistantName as string | undefined) ||
                  `My assistant ${idx + 1}`;
                const assistantDescription = assistant.metadata
                  ?.assistantDescription as string | undefined;
                return (
                  <DropdownMenuRadioItem
                    key={assistant.assistant_id}
                    value={assistant.assistant_id}
                    className={cn("py-2 cursor-pointer")}
                  >
                    <div className="flex flex-col">
                      <p className="text-sm text-gray-800">{assistantName}</p>
                      {assistantDescription && (
                        <p className="text-xs font-light text-gray-500 mt-1 truncate max-w-64">
                          {assistantDescription}
                        </p>
                      )}
                    </div>
                  </DropdownMenuRadioItem>
                );
              })
            ) : (
              <p className="text-sm text-gray-700 p-2">
                No assistants found. Please create one.
              </p>
            )}
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="cursor-pointer">
            <NewAssistantDialog
              createAssistant={props.createAssistant}
              userId={props.userId}
            />
          </DropdownMenuLabel>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
