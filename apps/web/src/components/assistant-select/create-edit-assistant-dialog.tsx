"use client";

import {
  CreateCustomAssistantArgs,
  EditCustomAssistantArgs,
} from "@/contexts/AssistantContext";
import { Assistant } from "@langchain/langgraph-sdk";
import {
  Dispatch,
  FormEvent,
  SetStateAction,
  useEffect,
  useState,
} from "react";
import * as Icons from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { TighterText } from "../ui/header";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { IconSelect } from "./icon-select";
import React from "react";
import { useToast } from "@/hooks/use-toast";
import { ColorPicker } from "./color-picker";
import { Textarea } from "../ui/textarea";
import { InlineContextTooltip } from "../ui/inline-context-tooltip";
import { useStore } from "@/hooks/useStore";
import { arrayToFileList, contextDocumentToFile } from "@/lib/attachments";
import { ContextDocuments } from "./context-documents";
import { useContextDocuments } from "@/hooks/useContextDocuments";

interface CreateEditAssistantDialogProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  userId: string | undefined;
  isEditing: boolean;
  assistant?: Assistant;
  createCustomAssistant: ({
    newAssistant,
    userId,
    successCallback,
  }: CreateCustomAssistantArgs) => Promise<Assistant | undefined>;
  editCustomAssistant: ({
    editedAssistant,
    assistantId,
    userId,
  }: EditCustomAssistantArgs) => Promise<Assistant | undefined>;
  isLoading: boolean;
  allDisabled: boolean;
  setAllDisabled: Dispatch<SetStateAction<boolean>>;
}

const GH_DISCUSSION_URL = `https://github.com/langchain-ai/open-canvas/discussions/182`;

const SystemPromptWhatsThis = (): React.ReactNode => (
  <span className="flex flex-col gap-1 text-sm text-gray-600">
    <p>
      Custom system prompts will be passed to the LLM when generating, or
      re-writing artifacts. They are <i>not</i> used for responding to general
      queries in the chat, highlight to edit, or quick actions.
    </p>
    <p>
      We&apos;re looking for feedback on how to best handle customizing
      assistant prompts. To vote, and give feedback please visit{" "}
      <a href={GH_DISCUSSION_URL} target="_blank">
        this GitHub discussion
      </a>
      .
    </p>
  </span>
);

export function CreateEditAssistantDialog(
  props: CreateEditAssistantDialogProps
) {
  const { putContextDocuments, getContextDocuments } = useStore();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [iconName, setIconName] = useState<keyof typeof Icons>("User");
  const [hasSelectedIcon, setHasSelectedIcon] = useState(false);
  const [iconColor, setIconColor] = useState("#000000");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [hoverTimer, setHoverTimer] = useState<NodeJS.Timeout | null>(null);
  const {
    documents,
    setDocuments,
    urls,
    setUrls,
    loadingDocuments,
    setLoadingDocuments,
    processDocuments,
    setProcessedContextDocuments,
  } = useContextDocuments(props.userId || "");

  const metadata = props.assistant?.metadata as Record<string, any> | undefined;

  useEffect(() => {
    if (props.assistant && props.isEditing) {
      setName(props.assistant?.name || "");
      setDescription(metadata?.description || "");
      setSystemPrompt(
        (props.assistant?.config?.configurable?.systemPrompt as
          | string
          | undefined) || ""
      );
      setHasSelectedIcon(true);
      setIconName(metadata?.iconData?.iconName || "User");
      setIconColor(metadata?.iconData?.iconColor || "#000000");
      setLoadingDocuments(true);
      getContextDocuments(props.assistant.assistant_id)
        .then((documents) => {
          if (documents) {
            const files = documents
              .filter((d) => !d.metadata?.url)
              .map(contextDocumentToFile);

            const urls = documents
              .filter((d) => d.metadata?.url)
              .map((d) => d.metadata?.url);

            setProcessedContextDocuments(
              new Map(
                documents.map((d) => {
                  if (d.metadata?.url) {
                    return [d.metadata?.url, d];
                  } else {
                    return [d.name, d];
                  }
                })
              )
            );

            setUrls(urls);
            setDocuments(arrayToFileList(files));
          }
        })
        .finally(() => setLoadingDocuments(false));
    } else if (!props.isEditing) {
      setName("");
      setDescription("");
      setSystemPrompt("");
      setIconName("User");
      setIconColor("#000000");
      setDocuments(undefined);
      setUrls([]);
    }
  }, [props.assistant, props.isEditing]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!props.userId) {
      toast({
        title: "User not found",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }
    if (props.isEditing && !props.assistant) {
      toast({
        title: "Assistant not found",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }

    props.setAllDisabled(true);

    const contentDocuments = await processDocuments();

    let success: boolean;
    if (props.isEditing && props.assistant) {
      const updatedAssistant = await props.editCustomAssistant({
        editedAssistant: {
          name,
          description,
          systemPrompt,
          iconData: {
            iconName,
            iconColor,
          },
        },
        assistantId: props.assistant.assistant_id,
        userId: props.userId,
      });
      success = !!updatedAssistant;
      if (updatedAssistant) {
        await putContextDocuments({
          assistantId: props.assistant.assistant_id,
          documents: contentDocuments,
        });
      }
    } else {
      const assistant = await props.createCustomAssistant({
        newAssistant: {
          name,
          description,
          systemPrompt,
          iconData: {
            iconName,
            iconColor,
          },
        },
        userId: props.userId,
      });
      success = !!assistant;
      if (assistant) {
        await putContextDocuments({
          assistantId: assistant.assistant_id,
          documents: contentDocuments,
        });
      }
    }

    if (success) {
      toast({
        title: `Assistant ${props.isEditing ? "edited" : "created"} successfully`,
        duration: 5000,
      });
    } else {
      toast({
        title: `Failed to ${props.isEditing ? "edit" : "create"} assistant`,
        variant: "destructive",
        duration: 5000,
      });
    }
    props.setAllDisabled(false);
    props.setOpen(false);
  };

  const handleResetState = () => {
    setName("");
    setDescription("");
    setSystemPrompt("");
    setIconName("User");
    setIconColor("#000000");
  };

  const handleRemoveFile = (index: number) => {
    setDocuments((prev) => {
      if (!prev) return prev;
      const files = Array.from(prev);
      const newFiles = files.filter((_, i) => i !== index);
      return arrayToFileList(newFiles);
    });
  };

  if (props.isEditing && !props.assistant) {
    return null;
  }

  return (
    <Dialog
      open={props.open}
      onOpenChange={(change) => {
        if (!change) {
          handleResetState();
        }
        props.setOpen(change);
      }}
    >
      <DialogContent className="max-w-xl max-h-[90vh] p-8 bg-white rounded-lg shadow-xl min-w-[70vw] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        <DialogHeader>
          <DialogTitle className="text-3xl font-light text-gray-800">
            <TighterText>
              {props.isEditing ? "Edit" : "Create"} Assistant
            </TighterText>
          </DialogTitle>
          <DialogDescription className="mt-2 text-md font-light text-gray-600">
            <TighterText>
              Creating a new assistant allows you to tailor your reflections to
              a specific context, as reflections are unique to assistants.
            </TighterText>
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => handleSubmit(e)}
          className="flex flex-col items-start justify-start gap-4 w-full"
        >
          <Label htmlFor="name">
            <TighterText>
              Name <span className="text-red-500">*</span>
            </TighterText>
          </Label>
          <Input
            disabled={props.allDisabled}
            required
            id="name"
            placeholder="Work Emails"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Label htmlFor="description">
            <TighterText>Description</TighterText>
          </Label>
          <Input
            disabled={props.allDisabled}
            required={false}
            id="description"
            placeholder="Assistant for my work emails"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <Label htmlFor="system-prompt">
            <TighterText className="flex items-center">
              System Prompt
              <InlineContextTooltip cardContentClassName="w-[500px] ml-10">
                <SystemPromptWhatsThis />
              </InlineContextTooltip>
            </TighterText>
          </Label>
          <Textarea
            disabled={props.allDisabled}
            required={false}
            id="system-prompt"
            placeholder="You are an expert email assistant..."
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={5}
          />

          <div className="flex w-full items-center justify-between gap-4">
            <div className="flex flex-col gap-4 items-start justify-start w-full">
              <Label htmlFor="icon">
                <TighterText>Icon</TighterText>
              </Label>
              <IconSelect
                allDisabled={props.allDisabled}
                iconColor={iconColor}
                selectedIcon={iconName}
                setSelectedIcon={(i) => {
                  setHasSelectedIcon(true);
                  setIconName(i);
                }}
                hasSelectedIcon={hasSelectedIcon}
              />
            </div>
            <div className="flex flex-col gap-4 items-start justify-start w-full">
              <Label htmlFor="description">
                <TighterText>Color</TighterText>
              </Label>
              <div className="flex gap-1 items-center justify-start w-full">
                <ColorPicker
                  disabled={props.allDisabled}
                  iconColor={iconColor}
                  setIconColor={setIconColor}
                  showColorPicker={showColorPicker}
                  setShowColorPicker={setShowColorPicker}
                  hoverTimer={hoverTimer}
                  setHoverTimer={setHoverTimer}
                />
                <Input
                  disabled={props.allDisabled}
                  required={false}
                  id="description"
                  placeholder="Assistant for my work emails"
                  value={iconColor}
                  onChange={(e) => {
                    if (!e.target.value.startsWith("#")) {
                      setIconColor("#" + e.target.value);
                    } else {
                      setIconColor(e.target.value);
                    }
                  }}
                />
              </div>
            </div>
          </div>

          <ContextDocuments
            documents={documents}
            setDocuments={setDocuments}
            loadingDocuments={loadingDocuments}
            allDisabled={props.allDisabled}
            handleRemoveFile={handleRemoveFile}
            urls={urls}
            setUrls={setUrls}
          />

          <div className="flex items-center justify-center w-full mt-4 gap-3">
            <Button
              disabled={props.allDisabled}
              className="w-full"
              type="submit"
            >
              <TighterText>Save</TighterText>
            </Button>
            <Button
              disabled={props.allDisabled}
              onClick={() => {
                handleResetState();
                props.setOpen(false);
              }}
              variant="destructive"
              className="w-[20%]"
              type="button"
            >
              <TighterText>Cancel</TighterText>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
