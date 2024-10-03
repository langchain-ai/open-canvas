"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { setCookie, getCookie } from "@/lib/cookies";
import { HAS_SEEN_DIALOG } from "@/constants";
import { Button } from "./ui/button";
import { DialogContentProps } from "@radix-ui/react-dialog";
import { Textarea } from "./ui/textarea";
import { Progress } from "@radix-ui/react-progress";
import { Input } from "./ui/input";
import { type Assistant } from "@langchain/langgraph-sdk";
import { Loader } from "lucide-react";

function StepOne() {
  return (
    <div className="space-y-4">
      <h3 className="text-2xl font-semibold text-gray-800">Welcome!</h3>
      <p className="text-lg text-gray-600">
        This intelligent companion is designed to help you craft engaging
        content. As you interact with it, it learns and adapts to your style and
        preferences.
      </p>
      <p className="text-base text-gray-600 font-light">
        <strong className="font-bold">Please note:</strong> The initial output
        may not be perfect. It&apos;s designed to start as a blank state. The
        more you work with it, the better it becomes at understanding your needs
        and generating relevant content.
      </p>
    </div>
  );
}

function StepTwo() {
  return (
    <div className="space-y-4">
      <h3 className="text-2xl font-semibold text-gray-800">How It Works</h3>
      <p className="text-base text-gray-600">
        The Content Writer uses a dynamic system of rules to improve its
        performance over time. These rules help guide the AI in generating
        content that matches your style and needs.
      </p>
      <p className="text-base text-gray-600">There are two types of rules:</p>
      <ul className="list-disc list-inside text-base text-gray-600 space-y-2">
        <li>Style rules: Guidelines for tone, structure, and writing style</li>
        <li>
          Content rules: Domain-specific guidelines for context and purpose
        </li>
      </ul>
      <p className="text-base text-gray-600">
        Rules are automatically generated and updated when you:
      </p>
      <ul className="list-disc list-inside text-base text-gray-600 space-y-2">
        <li>Copy any AI-generated message</li>
        <li>Edit and save any AI-generated message</li>
      </ul>
    </div>
  );
}

interface StepThreeProps {
  isLoading: boolean;
  setOpen: (open: boolean) => void;
  setSystemRulesAndSave: (newSystemRules: string) => Promise<void>;
  systemRules: string | undefined;
  setSystemRules: (newSystemRules: string) => void;
  assistantName: string;
  assistantDescription: string;
  setAssistantName: (name: string) => void;
  setAssistantDescription: (description: string) => void;
}

function StepThree(props: StepThreeProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-2xl font-semibold text-gray-800">
        Customize Your Experience
      </h3>
      <p className="text-base text-gray-600">
        Below are the default system rules. These are included in every request,
        and can only be modified by you, the user.
      </p>
      <p className="text-base text-gray-600">
        Feel free to edit them to better suit your needs:
      </p>
      {!props.isLoading ? (
        <>
          <Textarea
            rows={8}
            value={props.systemRules}
            onChange={(e) => props.setSystemRules(e.target.value)}
          />
          <p className="text-base text-gray-600">
            Optionally, you can give your assistant a name and description. This
            has no effect on the generated content.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-xs text-gray-500">(optional)</span>
            </label>
            <Input
              value={props.assistantName}
              onChange={(e) => props.setAssistantName(e.target.value)}
              placeholder="Tweet writer"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description{" "}
              <span className="text-xs text-gray-500">(optional)</span>
            </label>
            <Textarea
              rows={2}
              value={props.assistantDescription}
              onChange={(e) => props.setAssistantDescription(e.target.value)}
              placeholder="For writing tweets about..."
              className="w-full"
            />
          </div>
        </>
      ) : (
        <>
          <p className="flex items-center">
            <Loader className="mr-2 h-6 w-6 animate-spin" />
            <span className="text-base text-gray-600">
              Just a moment while we get everything ready...
            </span>
          </p>
        </>
      )}
    </div>
  );
}

export interface WelcomeDialogProps {
  isLoadingSystemRules: boolean;
  systemRules: string | undefined;
  setSystemRulesAndSave: (newSystemRules: string) => Promise<void>;
  setSystemRules: (newSystemRules: string) => void;
  assistantId: string | undefined;
  userId: string | undefined;
  updateAssistantMetadata: (
    assistantId: string,
    fields: { metadata: Record<string, any> }
  ) => Promise<Assistant>;
}

export function WelcomeDialog(props: WelcomeDialogProps) {
  const {
    isLoadingSystemRules,
    systemRules,
    setSystemRulesAndSave,
    setSystemRules,
  } = props;
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [assistantName, setAssistantName] = useState("");
  const [assistantDescription, setAssistantDescription] = useState("");

  useEffect(() => {
    const hasUserSeenDialog = getCookie(HAS_SEEN_DIALOG);
    if (!hasUserSeenDialog) {
      setOpen(true);
    }
  }, []);

  const handleClose = async () => {
    setCookie(HAS_SEEN_DIALOG, "true");
    void setSystemRulesAndSave(systemRules ?? "");
    if (assistantName || assistantDescription) {
      if (!props.assistantId) {
        throw new Error(
          "Unable to update assistant metadata: assistantId is undefined"
        );
      }
      if (!props.userId) {
        throw new Error("Can not save assistant if userId is undefined.");
      }

      setOpen(false);
      await props.updateAssistantMetadata(props.assistantId, {
        metadata: {
          assistantName,
          assistantDescription,
          userId: props.userId,
        },
      });
    }
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleClose();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handlePointerDownOutside: DialogContentProps["onPointerDownOutside"] = (
    event
  ) => {
    event.preventDefault();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="max-w-2xl p-8"
        onPointerDownOutside={handlePointerDownOutside}
        hideCloseIcon={true}
      >
        <DialogHeader>
          <DialogTitle className="text-3xl font-light text-gray-800">
            LangChain&apos;s Content Writer
          </DialogTitle>
          <DialogDescription className="mt-2 text-lg font-light text-gray-600">
            Your intelligent companion for crafting engaging content
          </DialogDescription>
        </DialogHeader>
        <div className="mt-6">
          {step === 1 ? <StepOne /> : null}
          {step === 2 ? <StepTwo /> : null}
          {step === 3 ? (
            <StepThree
              isLoading={isLoadingSystemRules}
              systemRules={systemRules}
              setSystemRules={setSystemRules}
              setSystemRulesAndSave={setSystemRulesAndSave}
              setOpen={(open) => {
                if (!open) {
                  handleClose();
                }
              }}
              assistantName={assistantName}
              assistantDescription={assistantDescription}
              setAssistantName={setAssistantName}
              setAssistantDescription={setAssistantDescription}
            />
          ) : null}
        </div>
        <div className="mt-8 flex justify-between">
          {step > 1 && (
            <Button variant="outline" onClick={handleBack}>
              Back
            </Button>
          )}
          {step < 3 && (
            <Button className="ml-auto" onClick={handleNext}>
              Next
            </Button>
          )}
          {step === 3 && (
            <Button
              className="ml-auto"
              disabled={isLoadingSystemRules}
              onClick={handleClose}
            >
              Get started
            </Button>
          )}
        </div>
        <Progress
          value={((step - 1) / 2) * 100}
          className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden"
        >
          <div
            className="h-full bg-black transition-all duration-300 ease-in-out"
            style={{ width: `${((step - 1) / 2) * 100}%` }}
          />
        </Progress>
      </DialogContent>
    </Dialog>
  );
}
