'use client';

import { useRef } from 'react';
import { Header } from '@/components/header';
import { StrategyListSidebar } from '@/components/strategy-list-sidebar';
import { MainContentArea } from '@/components/main-content-area';
import { AIChatPanel } from '@/components/ai-chat-panel';

export default function HomePage() {
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const switchToEditorRef = useRef<(() => void) | null>(null);

  const handleCreateWithAI = () => {
    // Focus the AI chat input
    chatInputRef.current?.focus();
  };

  const handleSwitchToEditor = (handler: () => void) => {
    switchToEditorRef.current = handler;
  };

  const handleApplyStrategy = () => {
    switchToEditorRef.current?.();
  };

  return (
    <div className="h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <StrategyListSidebar />
        <MainContentArea
          onCreateWithAI={handleCreateWithAI}
          onSwitchToEditor={handleSwitchToEditor}
        />
        <AIChatPanel onApplyStrategy={handleApplyStrategy} />
      </div>
    </div>
  );
}
