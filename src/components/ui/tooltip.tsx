"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

import { cn } from "@/lib/utils";

function TooltipProvider({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return <TooltipPrimitive.Provider data-slot="tooltip-provider" {...props} />;
}

function Tooltip({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return <TooltipPrimitive.Root data-slot="tooltip" {...props} />;
}

function TooltipTrigger({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

function TooltipContent({
  className,
  sideOffset = 6,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Content
      data-slot="tooltip-content"
      sideOffset={sideOffset}
      className={cn(
        "bg-popover text-popover-foreground data-[state=delayed-open]:data-[side=top]:slide-in-from-bottom-1 data-[state=delayed-open]:data-[side=right]:slide-in-from-left-1 data-[state=delayed-open]:data-[side=left]:slide-in-from-right-1 data-[state=delayed-open]:data-[side=bottom]:slide-in-from-top-1 z-50 overflow-hidden rounded-md border px-2 py-1 text-xs shadow-md animate-in fade-in-0 zoom-in-95",
        className,
      )}
      {...props}
    />
  );
}

export { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent };
