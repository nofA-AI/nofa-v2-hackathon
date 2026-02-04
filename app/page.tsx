'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { StrategyListSidebar } from '@/components/strategy-list-sidebar';
import { MainContentArea } from '@/components/main-content-area';
import { AIChatPanel } from '@/components/ai-chat-panel';
import { GuideView } from '@/components/guide-view';
import { InitialLoading } from '@/components/initial-loading';
import { useStrategyStore } from '@/lib/store/strategy-store';

export default function HomePage() {
  const [isReady, setIsReady] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const [showGuide, setShowGuide] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [chatPanelWidth, setChatPanelWidth] = useState(50); // Percentage width
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const switchToEditorRef = useRef<(() => void) | null>(null);
  const switchToBacktestRef = useRef<(() => void) | null>(null);
  const runBacktestRef = useRef<(() => Promise<void>) | null>(null);
  const sendMessageRef = useRef<((message: { text: string; files?: File[] }) => void) | null>(null);
  const hasInitializedGuide = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const { strategies, createStrategy, chatMessages, currentStrategyId, updateStrategyTree } = useStrategyStore();
  const [storedMessagesCache, setStoredMessagesCache] = useState(new Map<string, unknown[]>());

  const getStorageKey = (strategyId?: string | null) => `aiChatMessages:${strategyId || 'default'}`;


  const loadStoredMessages = (storageKey: string) => {
    if (typeof window === 'undefined') return [] as unknown[];

    const cached = storedMessagesCache.get(storageKey);
    if (cached) return cached;

    try {
      const raw = localStorage.getItem(storageKey);
      const parsed = raw ? (JSON.parse(raw) as unknown[]) : [];
      setStoredMessagesCache(prev => new Map(prev).set(storageKey, parsed));
      return parsed;
    } catch {
      const empty: unknown[] = [];
      setStoredMessagesCache(prev => new Map(prev).set(storageKey, empty));
      return empty;
    }
  };

  const hasChatMessagesForStrategy = (strategyId: string | null) => {
    if (!strategyId) return false;
    const storedMessages = loadStoredMessages(getStorageKey(strategyId));
    return storedMessages.length > 0;
  };

  // Preload all aiChatMessages into cache on mount and invalidate on currentStrategyId change
  useEffect(() => {
    if (typeof window === 'undefined') return;

    strategies.forEach((strategy) => {
      const storageKey = getStorageKey(strategy.id);
      if (!storedMessagesCache.has(storageKey)) {
        loadStoredMessages(storageKey);
      }
    });
  }, [strategies, storedMessagesCache]);

  // Invalidate cache for current strategy when switching
  useEffect(() => {
    if (!currentStrategyId) return;
    setStoredMessagesCache(prev => {
      const next = new Map(prev);
      next.delete(getStorageKey(currentStrategyId));
      return next;
    });
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

  // Load saved panel width from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const saved = localStorage.getItem('chatPanelWidth');
    if (saved) {
      const width = parseFloat(saved);
      if (!isNaN(width)) {
        setChatPanelWidth(width);
      }
    }
  }, []);

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
  }, [currentStrategyId, isReady, showOverlay, strategies, storedMessagesCache]);

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

  const handleRegisterSendMessage = (sender: (message: { text: string; files?: File[] }) => void) => {
    sendMessageRef.current = sender;
  };

  const handleSendMessage = (message: { text: string; files?: File[] }) => {
    sendMessageRef.current?.(message);
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
    // Close guide and apply strategy to editor
    setShowGuide(false);

    if (strategy.strategyJson) {
      // Apply the strategy JSON to the current strategy
      updateStrategyTree(strategy.strategyJson);

      // Send mock assistant message
      const assistantMessage = `I've generated the **${strategy.strategyJson.name}** strategy for you. ${strategy.strategyJson.description}\n\nYou can now:\n- Review and optimize the strategy in the editor\n- Run a backtest to see how it performs\n- Deploy it when you're ready`;

      window.dispatchEvent(new CustomEvent('guide-strategy-applied', {
        detail: {
          message: assistantMessage,
          strategyJson: strategy.strategyJson
        }
      }));

      // Switch to editor view to see the applied strategy
      setTimeout(() => {
        switchToEditorRef.current?.();
      }, 300);
    }
  };

  const handleStartChat = () => {
    setShowGuide(false);
  };

  const handleGetStarted = () => {
    setShowGuide(false);
  };

  // Handle resize start
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = chatPanelWidth;
  };

  // Handle resize move
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const container = containerRef.current;
      const containerWidth = container.offsetWidth;
      const deltaX = e.clientX - startXRef.current;
      const deltaPercent = (deltaX / containerWidth) * 100;
      const newWidth = Math.max(15, Math.min(60, startWidthRef.current + deltaPercent));

      setChatPanelWidth(newWidth);
      // Save to localStorage
      localStorage.setItem('chatPanelWidth', newWidth.toString());
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  return (
    <div className="h-full flex relative overflow-hidden" ref={containerRef}>
      <StrategyListSidebar />

      {/* Main content area wrapper - relative positioning for GuideView */}
      <div className="flex-1 flex relative overflow-hidden">
          <AIChatPanel
            width={chatPanelWidth}
            onApplyStrategy={handleApplyStrategy}
            onRunBacktest={handleRunBacktest}
            onSwitchToBacktest={switchToBacktest}
            onRegisterSendMessage={handleRegisterSendMessage}
          />
          <MainContentArea
            width={100 - chatPanelWidth}
            onResizeStart={handleResizeStart}
            onCreateWithAI={handleCreateWithAI}
            onSwitchToEditor={handleSwitchToEditor}
            onSwitchToBacktest={handleSwitchToBacktest}
            onRegisterRunBacktest={handleRegisterRunBacktest}
            onSendMessage={handleSendMessage}
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

      <InitialLoading show={showOverlay} text="Loading strategies" />
    </div>
  );
}
