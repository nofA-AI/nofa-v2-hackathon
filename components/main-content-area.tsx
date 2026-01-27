'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StrategyTreeEditor } from '@/components/strategy-tree/strategy-tree-editor';
import { BacktestResults } from '@/components/backtest-results';
import { useStrategyStore } from '@/lib/store/strategy-store';

interface MainContentAreaProps {
  onCreateWithAI?: () => void;
  onSwitchToEditor?: (handler: () => void) => void;
}

export function MainContentArea({ onCreateWithAI, onSwitchToEditor }: MainContentAreaProps) {
  const [activeTab, setActiveTab] = useState('editor');
  const { currentStrategyId, createStrategy } = useStrategyStore();

  const handleCreateStrategy = () => {
    createStrategy();
  };

  const switchToEditor = () => {
    setActiveTab('editor');
  };

  // Expose switchToEditor to parent
  if (onSwitchToEditor) {
    onSwitchToEditor(switchToEditor);
  }

  if (!currentStrategyId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary"
            >
              <path d="M3 3v18h18" />
              <path d="m19 9-5 5-4-4-3 3" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">Welcome to StrategyForge</h2>
          <p className="text-muted-foreground mb-6">
            Build and backtest quantitative trading strategies with AI assistance.
            Create a new strategy from the sidebar or use AI to generate one.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleCreateStrategy}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 font-medium transition-colors"
            >
              Create Strategy
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background overflow-hidden">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <div className="border-b border-border bg-card px-4">
          <TabsList className="h-12 bg-transparent p-0 gap-4">
            <TabsTrigger
              value="editor"
              className="h-12 px-0 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Strategy Editor
            </TabsTrigger>
            <TabsTrigger
              value="backtest"
              className="h-12 px-0 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Backtest Results
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="editor" className="flex-1 m-0 overflow-auto data-[state=inactive]:hidden">
          <StrategyTreeEditor onCreateWithAI={onCreateWithAI} />
        </TabsContent>

        <TabsContent value="backtest" className="flex-1 m-0 overflow-auto data-[state=inactive]:hidden">
          <BacktestResults />
        </TabsContent>
      </Tabs>
    </div>
  );
}
