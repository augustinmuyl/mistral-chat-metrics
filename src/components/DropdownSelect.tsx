"use client";

import { useMemo } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ChevronDownIcon } from "lucide-react";

type Option = { label: string; value: string };

type Props = {
  options: Option[];
  value?: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  triggerLabel?: string;
  ariaLabel?: string;
  className?: string;
  contentClassName?: string;
  disabled?: boolean;
};

export default function DropdownSelect({
  options,
  value,
  onChange,
  placeholder = "Select...",
  triggerLabel,
  ariaLabel,
  className,
  contentClassName,
  disabled,
}: Props) {
  const selectedLabel = useMemo(() => {
    const found = options.find((o) => o.value === value);
    return found?.label ?? placeholder;
  }, [options, value, placeholder]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={ariaLabel}
        disabled={disabled}
        className={cn(
          "border rounded px-2 py-1 text-sm inline-flex items-center gap-2 select-none hover:cursor-pointer",
          disabled && "opacity-50 cursor-not-allowed",
          className,
        )}
      >
        <span className="truncate max-w-[16rem]">
          {triggerLabel ?? selectedLabel}
        </span>
        <ChevronDownIcon className="size-4 opacity-70" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className={cn("min-w-[12rem]", contentClassName)}>
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(v) => onChange?.(v)}
        >
          {options.map((opt) => (
            <DropdownMenuRadioItem key={opt.value} value={opt.value}>
              {opt.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
