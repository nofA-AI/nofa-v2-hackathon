'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Header } from '@/components/header';
import { StrategyListSidebar } from '@/components/strategy-list-sidebar';
import { MainContentArea } from '@/components/main-content-area';
import { AIChatPanel } from '@/components/ai-chat-panel';
import { GuideView } from '@/components/guide-view';
import { useStrategyStore } from '@/lib/store/strategy-store';

export default function HomePage() {
  const [isReady, setIsReady] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const [showGuide, setShowGuide] = useState(false);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const switchToEditorRef = useRef<(() => void) | null>(null);
  const switchToBacktestRef = useRef<(() => void) | null>(null);
  const runBacktestRef = useRef<(() => Promise<void>) | null>(null);
  const hasInitializedGuide = useRef(false);
  const { strategies, createStrategy, chatMessages, currentStrategyId } = useStrategyStore();
  const storedMessagesCacheRef = useRef(new Map<string, unknown[]>());

  const getStorageKey = (strategyId?: string | null) => `aiChatMessages:${strategyId || 'default'}`;

  const loadStoredMessages = (storageKey: string) => {
    if (typeof window === 'undefined') return [] as unknown[];

    const cached = storedMessagesCacheRef.current.get(storageKey);
    if (cached) return cached;

    try {
      const raw = localStorage.getItem(storageKey);
      const parsed = raw ? (JSON.parse(raw) as unknown[]) : [];
      storedMessagesCacheRef.current.set(storageKey, parsed);
      return parsed;
    } catch {
      const empty: unknown[] = [];
      storedMessagesCacheRef.current.set(storageKey, empty);
      return empty;
    }
  };

  const hasChatMessagesForStrategy = (strategyId: string | null) => {
    if (!strategyId) return false;
    const storedMessages = loadStoredMessages(getStorageKey(strategyId));
    return storedMessages.length > 0;
  };

  useEffect(() => {
    if (!currentStrategyId) return;
    storedMessagesCacheRef.current.delete(getStorageKey(currentStrategyId));
  }, [currentStrategyId]);

  // Check if a strategy has been edited or has chat messages
  const isStrategyUntouched = (strategyId: string) => {
    const strategy = strategies.find((s) => s.id === strategyId);
    if (!strategy) return true;

    // Check if has chat messages (store or localStorage)
    if (hasChatMessagesForStrategy(strategyId)) return false;

    // Check if strategy tree has been edited (compare with DEFAULT_STRATEGY_TREE structure)
    const tree = strategy.strategyTree;
    const mainDecision = tree.mainDecision;

    // Handle both single and array mainDecision
    if (Array.isArray(mainDecision)) {
      return mainDecision.length === 0;
    }

    const isDefaultTree =
      mainDecision.conditions.length === 0 &&
      mainDecision.thenAction === 'NO ACTION' &&
      mainDecision.elseAction === 'NO ACTION';

    return isDefaultTree;
  };

  // Wait for client hydration / local data access
  // Simulate fetch data from backend
  useEffect(() => {
    // Only initialize once when strategies are loaded
    if (hasInitializedGuide.current) return;

    let fadeTimer: ReturnType<typeof setTimeout>;
    const readyTimer = setTimeout(() => {
      setIsReady(true);
      fadeTimer = setTimeout(() => {
        setShowOverlay(false);
        if (hasChatMessagesForStrategy(currentStrategyId ?? null)) {
          setShowGuide(false);
          hasInitializedGuide.current = true;
          return;
        }
        // Check if this is a new user (no strategies)
        if (strategies.length === 0) {
          createStrategy();
          setShowGuide(true);
          hasInitializedGuide.current = true;
        } else if (!currentStrategyId) {
          // Has strategies but no current strategy selected
          // Check if first strategy is untouched to show guide
          const firstStrategy = strategies[0];
          if (firstStrategy && isStrategyUntouched(firstStrategy.id)) {
            setShowGuide(true);
          }
          hasInitializedGuide.current = true;
        } else {
          // Has current strategy - check if it's untouched to show guide
          if (isStrategyUntouched(currentStrategyId)) {
            setShowGuide(true);
          }
          hasInitializedGuide.current = true;
        }
      }, 500);
    }, 500);

    return () => {
      clearTimeout(readyTimer);
      if (fadeTimer) clearTimeout(fadeTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strategies, chatMessages, currentStrategyId, createStrategy]);

  // Check if guide should be shown when strategy or chat changes
  useEffect(() => {
    if (!isReady || showOverlay) return;

    if (hasChatMessagesForStrategy(currentStrategyId ?? null)) {
      setShowGuide(false);
      return;
    }

    if (currentStrategyId && isStrategyUntouched(currentStrategyId)) {
      setShowGuide(true);
    } else {
      setShowGuide(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStrategyId, isReady, showOverlay, strategies]);

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

  const switchToBacktest = () => {
    switchToBacktestRef.current?.();
  };

  const handleNewsClick = (news: any) => {
    // Close guide and switch to main interface
    setShowGuide(false);
    // Focus AI chat and send news analysis request
    setTimeout(() => {
      chatInputRef.current?.focus();
      // TODO: Send news content to AI for analysis
      // This would typically trigger an AI message with the news content
    }, 300);
  };

  const handleStrategyClick = (strategy: any) => {
    // Close guide and switch to main interface with strategy and backtest
    setShowGuide(false);
    // Switch to backtest view and run backtest
    setTimeout(() => {
      switchToBacktestRef.current?.();
      runBacktestRef.current?.();
      // TODO: Load the recommended strategy into the editor
    }, 300);
  };

  const handleStartChat = () => {
    setShowGuide(false);
  };

  const handleGetStarted = () => {
    setShowGuide(false);
  };

  return (
    <div className="h-screen flex flex-col relative overflow-hidden">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <StrategyListSidebar />

        {/* Main content area wrapper - relative positioning for GuideView */}
        <div className="flex-1 flex relative overflow-hidden">
          <MainContentArea
            onCreateWithAI={handleCreateWithAI}
            onSwitchToEditor={handleSwitchToEditor}
            onSwitchToBacktest={handleSwitchToBacktest}
            onRegisterRunBacktest={handleRegisterRunBacktest}
          />
          <AIChatPanel
            onApplyStrategy={handleApplyStrategy}
            onRunBacktest={handleRunBacktest}
            onSwitchToBacktest={switchToBacktest}
          />

          {/* Guide View overlays on top when active */}
          <AnimatePresence>
            {showGuide && (
              <GuideView
                onNewsClick={handleNewsClick}
                onStrategyClick={handleStrategyClick}
                onStartChat={handleStartChat}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {showOverlay && (
          <motion.div
            className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-background text-center"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
          >
            <div className="loading-lines">
              <div className="line" />
              <div className="line" />
              <div className="line" />
              <div className="line" />
            </div>
            <div className="text-sm text-muted-foreground mt-5 relative">
              Loading strategies
              <span className="dots absolute -right-[14px] top-[-1px]" aria-hidden="true">
                <span className="dot">.</span>
                <span className="dot">.</span>
                <span className="dot">.</span>
              </span>
            </div>

            <style jsx>{`
              .loading-lines {
                position: relative;
                width: 80px;
              }

              .line {
                position: absolute;
                left: 10px;
                top: 50%;
                width: 60px;
                height: 5px;
                background: #0f766e;
                border-radius: 9999px;
                opacity: 0.9;
                animation: spin 1.4s ease infinite;
                animation-delay: var(--delay);
              }

              .line:nth-of-type(1) { --rot: 0deg; --delay: 0s; }
              .line:nth-of-type(2) { --rot: 90deg; --delay: 0.1s; }
              .line:nth-of-type(3) { --rot: 180deg; --delay: 0.2s; }
              .line:nth-of-type(4) { --rot: 270deg; --delay: 0.3s; }

              @keyframes spin {
                100% { transform: rotate(360deg); }
              }

              .dots {
                display: inline-flex;
                gap: 0.1em;
              }

              .dot {
                display: inline-block;
                animation: dotPulse 1.2s ease-in-out infinite;
                opacity: 0.25;
              }

              .dot:nth-of-type(2) { animation-delay: 0.2s; }
              .dot:nth-of-type(3) { animation-delay: 0.4s; }

              @keyframes dotPulse {
                0%, 100% { opacity: 0.25; transform: translateY(0); }
                50% { opacity: 1; transform: translateY(-1px); }
              }

            `}</style>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
