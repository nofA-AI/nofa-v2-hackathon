'use client';

import { AnimatePresence, motion } from 'framer-motion';

interface InitialLoadingProps {
  show: boolean;
  text?: string;
}

export function InitialLoading({ show, text = 'Loading' }: InitialLoadingProps) {
  return (
    <AnimatePresence>
      {show && (
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
            {text}
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
  );
}
