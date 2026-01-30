import React, { useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ChartLine, Play } from '@phosphor-icons/react';
import type { StrategyTree } from '@/lib/types/strategy';

interface StrategyCardProps {
  extractedStrategy: StrategyTree | null;
  isGeneratingResponse?: boolean;
  isPreGenerated: boolean;
  hasApplied: boolean;
  onApply: () => void;
  onOpenBacktestDialog: () => void;
}

export function StrategyCard({
  extractedStrategy,
  isGeneratingResponse,
  isPreGenerated,
  hasApplied,
  onApply,
  onOpenBacktestDialog,
}: StrategyCardProps) {
  const strategyCardRef = useRef<HTMLDivElement>(null);

  if (!extractedStrategy || isGeneratingResponse) {
    return null;
  }

  return (
    <div
      ref={strategyCardRef}
      className="mt-3 p-3 rounded-md bg-card border border-border max-w-[360px]"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-foreground">
          Generated Strategy
        </span>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        {extractedStrategy.name}
      </p>
      {!isPreGenerated && (
        <Button
          size="sm"
          className="w-full gap-2"
          onClick={onApply}
          disabled={hasApplied}
        >
          <ChartLine className="w-4 h-4" />
          {hasApplied ? 'Strategy Applied' : 'Apply Strategy'}
        </Button>
      )}
      {(hasApplied || isPreGenerated) && (
        <Button
          size="sm"
          variant="outline"
          className={cn('w-full gap-2', !isPreGenerated && 'mt-2')}
          onClick={() => onOpenBacktestDialog()}
        >
          <Play className="w-4 h-4" />
          Run Backtest
        </Button>
      )}
    </div>
  );
}
