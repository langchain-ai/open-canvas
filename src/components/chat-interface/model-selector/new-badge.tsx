import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function IsNewBadge() {
  return (
    <div
      className={cn(
        "before:absolute relative p-[1px] before:p-[4px] rounded-md before:rounded-md before:shadow-[0_0_4px_rgba(236,72,153,0.2)] w-[58px]",
        "animate-gradient-xy before:animate-gradient-xy-enhanced",
        "before:inset-0 before:blur-sm before:-z-10 ",
        "from-pink-500/50 before:from-pink-500/20",
        "bg-gradient-to-r before:bg-gradient-to-r  ",
        "via-purple-500/50 before:via-purple-500/20",
        "to-pink-500/50 before:to-pink-500/20"
      )}
    >
      <Badge
        className={cn(
          "bg-gradient-to-r from-pink-50 via-purple-50 to-pink-50",
          "animate-gradient-x",
          "rounded-md transition-colors duration-300 ease-in-out",
          "text-gray-700 text-xs w-14"
        )}
      >
        New!
      </Badge>
    </div>
  );
}
