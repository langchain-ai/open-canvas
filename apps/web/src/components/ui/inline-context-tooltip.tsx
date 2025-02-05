import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";
import { CircleHelp } from "lucide-react";

export function InlineContextTooltip({
  cardContentClassName,
  children,
}: {
  cardContentClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <span className="inline-flex items-center ml-1">
          <CircleHelp className="w-3 h-3 text-gray-600" />
        </span>
      </HoverCardTrigger>
      <HoverCardContent
        className={cn(cardContentClassName, "w-[300px] text-wrap")}
      >
        <p className="text-black font-medium">What&apos;s this?</p>
        {children}
      </HoverCardContent>
    </HoverCard>
  );
}
