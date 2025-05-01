"use client";

import { forwardRef } from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type TooltipIconButtonProps = ButtonProps & {
  tooltip: string | React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  /**
   * @default 700
   */
  delayDuration?: number;
};

export const TooltipIconButton = forwardRef<
  HTMLButtonElement,
  TooltipIconButtonProps
>(
  (
    { children, tooltip, side = "bottom", className, delayDuration, ...rest },
    ref
  ) => {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={delayDuration ?? 700}>
          <TooltipTrigger asChild>
            <span>
              <Button
                variant="ghost"
                size="icon"
                {...rest}
                className={cn("size-6 p-1", className)}
                ref={ref}
              >
                {children}
                <span className="sr-only">{tooltip}</span>
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent side={side}>{tooltip}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
);

TooltipIconButton.displayName = "TooltipIconButton";
