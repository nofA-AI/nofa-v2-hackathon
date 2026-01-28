'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Header } from '@/components/header';
import { StrategyListSidebar } from '@/components/strategy-list-sidebar';
import { MainContentArea } from '@/components/main-content-area';
import { AIChatPanel } from '@/components/ai-chat-panel';

export default function HomePage() {
  const [isReady, setIsReady] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const switchToEditorRef = useRef<(() => void) | null>(null);
  const switchToBacktestRef = useRef<(() => void) | null>(null);
  const runBacktestRef = useRef<(() => Promise<void>) | null>(null);

  // Wait for client hydration / local data access
  // Simulate fetch data from backend
  useEffect(() => {
    let fadeTimer: ReturnType<typeof setTimeout>;
    const readyTimer = setTimeout(() => {
      setIsReady(true);
      fadeTimer = setTimeout(() => setShowOverlay(false), 500);
    }, 500);

    return () => {
      clearTimeout(readyTimer);
      if (fadeTimer) clearTimeout(fadeTimer);
    };
  }, []);

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

  return (
    <div className="h-screen flex flex-col relative overflow-hidden">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <StrategyListSidebar />
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
