import ModelSelector from "./ModelSelector";
import SystemPresetSelect from "./SystemPresetSelect";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu as MenuIcon } from "lucide-react";

type Props = {
  model: string;
  onModelChange: (v: string) => void;
  preset: string;
  onPresetChange: (v: string) => void;
  mockEnabled?: boolean;
  onClearHistory?: () => void;
};

export default function Topbar({
  model,
  onModelChange,
  preset,
  onPresetChange,
  mockEnabled,
  onClearHistory,
}: Props) {
  return (
    <div className="w-full flex items-center justify-between gap-3 py-3 px-4 border-b">
      <div className="text-xs sm:text-sm md:text-base lg:text-lg font-semibold">
        Mistral Chat + Metrics
      </div>

      {/* Desktop controls */}
      <div className="hidden sm:flex items-center gap-2">
        {mockEnabled ? (
          <span className="text-xs rounded bg-amber-100 text-amber-900 px-2 py-1">
            Mock mode
          </span>
        ) : null}
        <ModelSelector value={model} onChange={onModelChange} />
        <SystemPresetSelect value={preset} onChange={onPresetChange} />
        <button
          className="border rounded px-3 py-1 text-sm"
          onClick={onClearHistory}
          aria-label="Clear history"
        >
          Clear chat
        </button>
      </div>

      {/* Mobile hamburger menu */}
      <div className="sm:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Open menu"
            className="border rounded p-2 inline-flex items-center justify-center"
          >
            <MenuIcon className="size-5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="min-w-[14rem]">
            <DropdownMenuLabel>Settings</DropdownMenuLabel>
            {mockEnabled ? (
              <div className="px-2 py-1.5 text-xs text-amber-900 bg-amber-50 rounded">
                Mock mode
              </div>
            ) : null}
            {mockEnabled ? <DropdownMenuSeparator /> : null}

            {/* Model selection */}
            <div className="px-2 py-1.5 text-xs text-muted-foreground">
              Model
            </div>
            <DropdownMenuRadioGroup
              value={model}
              onValueChange={(v) => onModelChange(v)}
            >
              <DropdownMenuRadioItem value="mistral-large-latest">
                mistral-large-latest
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="mistral-small-latest">
                mistral-small-latest
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>

            <DropdownMenuSeparator />

            {/* Preset selection */}
            <div className="px-2 py-1.5 text-xs text-muted-foreground">
              Preset
            </div>
            <DropdownMenuRadioGroup
              value={preset}
              onValueChange={(v) => onPresetChange(v)}
            >
              <DropdownMenuRadioItem value="general">
                General
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="teacher">
                Teacher
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="coder">Coder</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="concise">
                Concise
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={onClearHistory}
              className="cursor-pointer"
              aria-label="Clear history"
            >
              Clear chat
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
