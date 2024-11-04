import { CreateAssistantFields } from "@/hooks/useAssistants";
import { Assistant } from "@langchain/langgraph-sdk";
import { Dispatch, FormEvent, SetStateAction, useState } from "react";
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

interface CreateEditAssistantDialogProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  isEditing: boolean;
  assistant?: Assistant;
  createCustomAssistant: (
    newAssistant: CreateAssistantFields,
    userId: string,
    successCallback?: (id: string) => void
  ) => Promise<boolean>;
  editCustomAssistant: (
    editedAssistant: CreateAssistantFields,
    assistantId: string,
    userId: string
  ) => Promise<Assistant | undefined>;
  isLoading: boolean;
}

export function CreateEditAssistantDialog(
  props: CreateEditAssistantDialogProps
) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [iconName, setIconName] = useState<keyof typeof Icons>("User");
  const [hasSelectedIcon, setHasSelectedIcon] = useState(false);
  const [iconColor, setIconColor] = useState("#000000");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  const handleClearState = () => {
    setName("");
    setDescription("");
    setIconName("User");
  };

  return (
    <Dialog
      open={props.open}
      onOpenChange={(change) => {
        if (!change) {
          handleClearState();
        }
        props.setOpen(change);
      }}
    >
      <DialogContent className="max-w-xl p-8 bg-white rounded-lg shadow-xl min-w-[70vw]">
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
            disabled={props.isLoading}
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
            disabled={props.isLoading}
            required={false}
            id="description"
            placeholder="Assistant for my work emails"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="flex w-full items-center justify-between gap-4">
            <div className="flex flex-col gap-4 items-start justify-start w-full">
              <Label htmlFor="icon">
                <TighterText>Icon</TighterText>
              </Label>
              <IconSelect
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
                <div
                  className="h-9 w-9 rounded-md"
                  style={{ backgroundColor: iconColor }}
                />
                <Input
                  disabled={props.isLoading}
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

          <div className="flex items-center justify-center w-full mt-4 gap-3">
            <Button disabled={props.isLoading} className="w-full" type="submit">
              <TighterText>Save</TighterText>
            </Button>
            <Button
              disabled={props.isLoading}
              onClick={() => {
                handleClearState();
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
