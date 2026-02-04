'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BacktestParams, BacktestResult, StrategyTree } from '@/lib/types/strategy';
import { runBacktest } from '@/lib/backtest';

/**
 * Hook to run backtest with caching and state management
 */
export function useRunBacktest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      strategyTree,
      params,
    }: {
      strategyTree: StrategyTree;
      params: BacktestParams;
    }) => {
      return await runBacktest(strategyTree, params);
    },
    onSuccess: (data, variables) => {
      // Cache the result with a unique key based on strategy and params
      const cacheKey = ['backtest', variables.strategyTree.name, variables.params];
      queryClient.setQueryData(cacheKey, data);
    },
  });
}

/**
 * Hook to get cached backtest results
 */
export function useBacktestResult(
  strategyTree: StrategyTree,
  params: BacktestParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: ['backtest', strategyTree.name, params],
    queryFn: async () => {
      return await runBacktest(strategyTree, params);
    },
    enabled: options?.enabled ?? false, // Don't auto-run, only fetch from cache
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
  });
}
