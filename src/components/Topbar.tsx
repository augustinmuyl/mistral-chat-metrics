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
import { Menu as MenuIcon, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import ConversationsSelect from "./ConversationsSelect";

type Props = {
  model: string;
  onModelChange: (v: string) => void;
  preset: string;
  onPresetChange: (v: string) => void;
  mockEnabled?: boolean;
  currentConversationId?: string;
  conversations?: Array<{ id: string; title?: string }>;
  onSelectConversation?: (id: string) => void;
  onNewChat?: () => void;
  onDeleteConversation?: () => void;
  onExportConversation?: () => void;
};

export default function Topbar({
  model,
  onModelChange,
  preset,
  onPresetChange,
  mockEnabled,
  currentConversationId,
  conversations = [],
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onExportConversation,
}: Props) {
  const canDelete = Boolean(
    currentConversationId &&
    conversations?.some((c) => c.id === currentConversationId),
  );
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
        {canDelete ? (
          <AlertDialog>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertDialogTrigger asChild>
                    <button
                      className="border rounded p-[6px] inline-flex items-center justify-center hover:cursor-pointer text-red-600"
                      aria-label="Delete conversation"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </AlertDialogTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom">Delete conversation</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this conversation?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. The conversation will be removed from your browser’s storage.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onDeleteConversation}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : null}
        <ConversationsSelect
          value={currentConversationId}
          conversations={conversations}
          onChange={onSelectConversation}
        />
        <ModelSelector value={model} onChange={onModelChange} />
        <SystemPresetSelect value={preset} onChange={onPresetChange} />
        {canDelete ? (
          <button
            className="border rounded px-3 py-1 text-sm hover:cursor-pointer"
            onClick={onExportConversation}
            aria-label="Export conversation"
          >
            Export
          </button>
        ) : null}
        <button
          className="border rounded px-3 py-1 text-sm hover:cursor-pointer"
          onClick={onNewChat}
          aria-label="New chat"
        >
          New chat
        </button>
      </div>

      {/* Mobile hamburger menu */}
      <div className="sm:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Open menu"
            className="border rounded p-2 inline-flex items-center justify-center hover:cursor-pointer"
          >
            <MenuIcon className="size-5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="min-w-[14rem] sm:hidden">
            <DropdownMenuLabel>Settings</DropdownMenuLabel>
            {mockEnabled ? (
              <div className="px-2 py-1.5 text-xs text-amber-900 bg-amber-50 rounded">
                Mock mode
              </div>
            ) : null}
            {mockEnabled ? <DropdownMenuSeparator /> : null}

            {/* Conversations */}
            <div className="px-2 py-1.5 text-xs text-muted-foreground">
              Conversations
            </div>
            <DropdownMenuRadioGroup
              value={currentConversationId ?? ""}
              onValueChange={(v) => onSelectConversation?.(v)}
            >
              {conversations.length === 0 ? (
                <div className="px-2 py-1.5 text-xs text-muted-foreground">
                  No conversations yet
                </div>
              ) : (
                conversations.map((c) => (
                  <DropdownMenuRadioItem key={c.id} value={c.id}>
                    {c.title || c.id}
                  </DropdownMenuRadioItem>
                ))
              )}
            </DropdownMenuRadioGroup>

            <DropdownMenuSeparator />

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
              onClick={onNewChat}
              className="cursor-pointer"
              aria-label="New chat"
            >
              New chat
            </DropdownMenuItem>
            {canDelete ? (
              <DropdownMenuItem
                onClick={onExportConversation}
                className="cursor-pointer"
                aria-label="Export conversation"
              >
                Export conversation
              </DropdownMenuItem>
            ) : null}
            {canDelete ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    aria-label="Delete conversation"
                    variant="destructive"
                  >
                    Delete conversation
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this conversation?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. The conversation will be removed from your browser’s storage.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onDeleteConversation}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
