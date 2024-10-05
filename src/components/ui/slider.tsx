"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, orientation = "horizontal", ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    orientation={orientation}
    className={cn(
      "relative flex touch-none select-none",
      orientation === "horizontal"
        ? "w-full items-center"
        : "h-full flex-col items-center",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track
      className={cn(
        "relative grow overflow-hidden rounded-full bg-gray-200",
        orientation === "horizontal" ? "h-1.5 w-full" : "h-full w-1.5"
      )}
    >
      <SliderPrimitive.Range
        className="absolute bg-gray-500"
        style={
          orientation === "horizontal" ? { height: "100%" } : { width: "100%" }
        }
      />
    </SliderPrimitive.Track>
    {[1, 2, 3, 4, 5].map((tick) => (
      <div
        key={tick}
        className="absolute h-2 w-2 rounded-full bg-gray-500"
        style={
          orientation === "horizontal"
            ? {
                left: `${((tick - 1) / 4) * 100}%`,
                transform: "translateX(-50%)",
              }
            : {
                bottom: `${((tick - 1) / 4) * 100}%`,
                transform: "translateY(50%)",
              }
        }
      />
    ))}
    <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full border border-gray-500 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50" />
  </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
