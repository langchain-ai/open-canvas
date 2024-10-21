import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { CircleHelp } from "lucide-react";

const CUSTOM_INSTRUCTIONS_TOOLTIP_TEXT = `This field contains the custom instructions you set, which will then be used to instruct the LLM on how to re-generate the selected artifact.`;
const FULL_PROMPT_TOOLTIP_TEXT = `This is the full prompt that will be set to the LLM when you invoke this quick action, including your custom instructions and other default context.`;

export const InlineContextTooltip = ({
  type,
}: {
  type: "custom_instructions" | "full_prompt";
}) => (
  <HoverCard>
    <HoverCardTrigger asChild>
      <span className="inline-flex items-center ml-1">
        <CircleHelp className="w-3 h-3 text-gray-600" />
      </span>
    </HoverCardTrigger>
    <HoverCardContent className="max-w-[300px] text-wrap">
      <p className="text-black font-medium">What&apos;s this?</p>
      <p className="text-sm text-gray-600">
        {type === "custom_instructions"
          ? CUSTOM_INSTRUCTIONS_TOOLTIP_TEXT
          : FULL_PROMPT_TOOLTIP_TEXT}
      </p>
    </HoverCardContent>
  </HoverCard>
);
