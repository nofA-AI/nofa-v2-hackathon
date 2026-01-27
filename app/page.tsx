'use client';

import { useRef } from 'react';
import { Header } from '@/components/header';
import { StrategyListSidebar } from '@/components/strategy-list-sidebar';
import { MainContentArea } from '@/components/main-content-area';
import { AIChatPanel } from '@/components/ai-chat-panel';

export default function HomePage() {
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const switchToEditorRef = useRef<(() => void) | null>(null);
  const switchToBacktestRef = useRef<(() => void) | null>(null);
  const runBacktestRef = useRef<(() => Promise<void>) | null>(null);

  const handleCreateWithAI = () => {
    // Focus the AI chat input
    chatInputRef.current?.focus();
  };

  const handleSwitchToEditor = (handler: () => void) => {
    switchToEditorRef.current = handler;
  };

  const handleSwitchToBacktest = (handler: () => void) => {
    switchToBacktestRef.current = handler;
  };

  const handleRegisterRunBacktest = (runner: () => Promise<void>) => {
    runBacktestRef.current = runner;
  };

  const handleApplyStrategy = () => {
    switchToEditorRef.current?.();
  };

  const handleRunBacktest = () => {
    switchToBacktestRef.current?.();
    runBacktestRef.current?.();
  };

  return (
    <div className="h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <StrategyListSidebar />
        <MainContentArea
          onCreateWithAI={handleCreateWithAI}
          onSwitchToEditor={handleSwitchToEditor}
          onSwitchToBacktest={handleSwitchToBacktest}
          onRegisterRunBacktest={handleRegisterRunBacktest}
        />
        <AIChatPanel onApplyStrategy={handleApplyStrategy} onRunBacktest={handleRunBacktest} />
      </div>
    </div>
  );
}
