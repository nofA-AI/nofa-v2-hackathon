'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StrategyTreeEditor } from '@/components/strategy-tree/strategy-tree-editor';
import { BacktestResults } from '@/components/backtest-results';
import { useStrategyStore } from '@/lib/store/strategy-store';

interface MainContentAreaProps {
  width?: number;
  onResizeStart?: (e: React.MouseEvent) => void;
  onCreateWithAI?: () => void;
  onSwitchToEditor?: (handler: () => void) => void;
  onSwitchToBacktest?: (handler: () => void) => void;
  onRegisterRunBacktest?: (runner: () => Promise<void>) => void;
  onSendMessage?: (message: { text: string; files?: File[] }) => void;
}

export function MainContentArea({ width, onResizeStart, onCreateWithAI, onSwitchToEditor, onSwitchToBacktest, onRegisterRunBacktest, onSendMessage }: MainContentAreaProps) {
  const [activeTab, setActiveTab] = useState('editor');
  const { currentStrategyId, createStrategy } = useStrategyStore();

  const handleCreateStrategy = () => {
    createStrategy();
  };

  const switchToEditor = () => {
    setActiveTab('editor');
  };

  const switchToBacktest = () => {
    setActiveTab('backtest');
  };

  // Expose switchToEditor to parent
  if (onSwitchToEditor) {
    onSwitchToEditor(switchToEditor);
  }

  if (onSwitchToBacktest) {
    onSwitchToBacktest(switchToBacktest);
  }

  // Switch to editor tab when strategy changes
  useEffect(() => {
    if (currentStrategyId) {
      setActiveTab('editor');
    }
  }, [currentStrategyId]);

  if (!currentStrategyId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background relative" style={width ? { flex: `0 0 ${width}%` } : {}}>
        {/* Resize Handle */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1 hover:bg-primary/50 cursor-ew-resize transition-colors z-10"
          onMouseDown={(e) => onResizeStart?.(e)}
        />
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
          <h2 className="text-xl font-semibold mb-2">Welcome to NOFA</h2>
          <p className="text-muted-foreground mb-6">
            Build and backtest quantitative trading strategies with NOFA AI.
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
    <div className="flex-1 flex flex-col bg-background overflow-hidden relative border-l border-border" style={width ? { flex: `0 0 ${width}%` } : {}}>
      {/* Resize Handle */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 hover:bg-primary/50 cursor-ew-resize transition-colors z-10"
        onMouseDown={(e) => onResizeStart?.(e)}
      />
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
          <StrategyTreeEditor onCreateWithAI={onCreateWithAI} onSwitchToBacktest={switchToBacktest} />
        </TabsContent>

        <TabsContent value="backtest" className="flex-1 m-0 overflow-auto data-[state=inactive]:hidden">
          <BacktestResults onReadyToRunBacktest={onRegisterRunBacktest} onSendMessage={onSendMessage} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
