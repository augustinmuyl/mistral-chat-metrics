"use client";

import { useState } from "react";
import { motion } from "motion/react";
import Topbar from "@/components/Topbar";
import MessageList from "@/components/MessageList";
import ChatComposer from "@/components/ChatComposer";
import SidebarMetrics from "@/components/SidebarMetrics";
import EmptyState from "@/components/EmptyState";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useChatController } from "@/lib/hooks/useChatController";

export default function Home() {
  const [metricsOpen, setMetricsOpen] = useState(false);

  const {
    messages,
    currentModel,
    setCurrentModel,
    currentPreset,
    setCurrentPreset,
    isStreaming,
    mockEnabled,
    latencyMs,
    durationMs,
    reqKB,
    respKB,
    tokens,
    conversationList,
    currentConversationId,
    onSend,
    onStop,
    onNewChat,
    onSelectConversation,
    onDeleteConversation,
    onExportConversation,
  } = useChatController();

  const hasMessages = messages.length > 0;

  return (
    <div className="h-dvh overflow-hidden flex flex-col">
      <Topbar
        model={currentModel}
        onModelChange={setCurrentModel}
        preset={currentPreset}
        onPresetChange={setCurrentPreset}
        mockEnabled={mockEnabled}
        currentConversationId={currentConversationId}
        conversations={conversationList}
        onSelectConversation={(id) => {
          setMetricsOpen(false);
          onSelectConversation(id);
        }}
        onNewChat={() => {
          onNewChat();
          setMetricsOpen(false);
        }}
        onDeleteConversation={onDeleteConversation}
        onOpenMetrics={() => setMetricsOpen(true)}
        onExportConversation={onExportConversation}
      />
      {hasMessages ? (
        <motion.div
          className="flex-1 min-h-0 grid grid-cols-1 grid-rows-[1fr_auto] lg:grid-rows-1 lg:grid-cols-[1fr_20rem] max-w-5xl mx-auto w-full gap-0"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          <motion.main
            className="px-4 py-4 flex flex-col gap-4 min-h-0 max-h-screen"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <ScrollArea className="flex-1 min-h-0 pr-1">
              <MessageList messages={messages} />
            </ScrollArea>
            <ChatComposer
              disabled={isStreaming}
              onSend={onSend}
              onStop={onStop}
            />
          </motion.main>
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut", delay: 0.06 }}
            className="hidden lg:block"
          >
            <SidebarMetrics
              latencyMs={latencyMs}
              durationMs={durationMs}
              reqKB={reqKB}
              respKB={respKB}
              model={currentModel}
              preset={currentPreset}
              tokens={tokens}
            />
          </motion.div>
        </motion.div>
      ) : (
        // Initial load: only main components, centered with fade-ins
        <motion.div
          className="flex-1 flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
        >
          <div className="w-full max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: "easeOut", delay: 0.04 }}
            >
              <EmptyState />
            </motion.div>
            <motion.div
              className="mt-4"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut", delay: 0.12 }}
            >
              <ChatComposer
                disabled={isStreaming}
                onSend={onSend}
                onStop={onStop}
              />
            </motion.div>
          </div>
        </motion.div>
      )}
      {/* Mobile metrics drawer (only when in a conversation) */}
      {hasMessages ? (
        <Drawer
          open={metricsOpen}
          onOpenChange={setMetricsOpen}
          direction="bottom"
        >
          <DrawerContent className="lg:hidden">
            <DrawerHeader>
              <DrawerTitle>Metrics</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-2">
              <SidebarMetrics
                latencyMs={latencyMs}
                durationMs={durationMs}
                reqKB={reqKB}
                respKB={respKB}
                model={currentModel}
                preset={currentPreset}
                tokens={tokens}
              />
            </div>
            <DrawerFooter>
              <DrawerClose asChild>
                <Button variant="outline">Close</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      ) : null}
    </div>
  );
}
