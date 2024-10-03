"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";

export interface RuleInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RuleInfoDialog(props: RuleInfoDialogProps) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary">
            Understanding Rule Generation
          </DialogTitle>
        </DialogHeader>
        <div className="mt-6 space-y-4">
          <p className="text-base text-gray-700 leading-relaxed">
            Rule generation is a process where our AI powered agent learns to
            create better content aligned with your preferences. It&apos;s
            triggered in two ways:
          </p>
          <ul className="list-disc list-inside text-base text-gray-700 leading-relaxed pl-4">
            <li>When you copy any AI-generated message</li>
            <li>When you edit and save any AI-generated message</li>
          </ul>
          <p className="text-base text-gray-700 leading-relaxed mb-4">
            Once triggered, the agent analyzes your conversation history and any
            edits you&apos;ve made to generate a set of rules. These rules fall
            into two categories:
          </p>
          <ol className="list-decimal list-inside text-base text-gray-700 leading-relaxed pl-4 mb-4">
            <li className="mb-2">
              <span className="font-semibold">Content-based rules:</span> These
              define the core elements and topics to include in your writing.
            </li>
            <li className="mb-2">
              <span className="font-semibold">Style-based rules:</span> These
              govern the tone, voice, and overall presentation of your writing.
            </li>
          </ol>
          <p className="text-base text-gray-700 leading-relaxed">
            By applying these rules, future writing suggestions are refined to
            better align with your unique style and preferences, ensuring a more
            personalized experience.
          </p>
        </div>
        <div className="mt-8 flex justify-end">
          <button
            onClick={() => props.onOpenChange(false)}
            className="px-6 py-2 bg-primary text-white text-lg font-semibold rounded-lg hover:bg-primary-dark transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
          >
            Got it!
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
