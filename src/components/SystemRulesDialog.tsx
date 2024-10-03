"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";

export interface SystemRulesProps {
  isLoadingSystemRules: boolean;
  systemRules: string | undefined;
  setSystemRulesAndSave: (newSystemRules: string) => Promise<void>;
  setSystemRules: (newSystemRules: string) => void;
}

export function SystemRulesDialog(props: SystemRulesProps) {
  const {
    systemRules,
    isLoadingSystemRules,
    setSystemRulesAndSave,
    setSystemRules,
  } = props;
  const [open, setOpen] = useState(false);

  const handleSaveAndClose = async () => {
    setOpen(false);
    await setSystemRulesAndSave(systemRules ?? "");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div
          onClick={() => setOpen(true)}
          className="fixed top-4 right-4 bg-white hover:bg-gray-50 text-black border border-gray-300 px-4 py-2 rounded-md shadow-sm transition-colors duration-200 cursor-pointer flex items-center space-x-2"
        >
          <p className="text-sm font-light">System Rules</p>
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-xl p-8 bg-white rounded-lg shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-3xl font-light text-gray-800">
            System Rules
          </DialogTitle>
          <DialogDescription className="mt-2 text-md font-light text-gray-600">
            The system rules set by you, included in every request.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-6 max-h-[60vh] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          {!isLoadingSystemRules ? (
            <div className="flex flex-col gap-4">
              <p className="text-sm font-light text-gray-600 mb-4">
                The agent has a set of &quot;system rules&quot; which are
                provided every time. You can edit them below.
              </p>
              <form
                className="flex flex-col gap-4"
                onSubmit={handleSaveAndClose}
              >
                <Textarea
                  rows={8}
                  value={systemRules}
                  onChange={(e) => setSystemRules(e.target.value)}
                />
              </form>
            </div>
          ) : (
            <p>Loading...</p>
          )}
        </div>
        <div className="mt-6 flex justify-end">
          <Button
            onClick={handleSaveAndClose}
            className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded shadow transition"
          >
            Save and close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
