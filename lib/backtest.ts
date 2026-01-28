import dayjs from 'dayjs';
import { BacktestParams, BacktestResult } from '@/lib/types/strategy';

/**
 * Mock backtest function that simulates strategy performance
 */
export const mockRunBacktest = async (
  strategyId: string,
  params: BacktestParams
): Promise<Omit<BacktestResult, 'id' | 'createdAt'>> => {
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Generate mock performance data
  const startDate = dayjs(params.startDate);
  const endDate = dayjs(params.endDate);
  const days = endDate.diff(startDate, 'day');

  const performanceData: { date: string; value: number }[] = [];
  let currentValue = params.initialCapital;

  for (let i = 0; i <= days; i++) {
    const date = startDate.add(i, 'day').format('YYYY-MM-DD');
    // Random walk with slight upward bias
    const change = (Math.random() - 0.48) * 0.02;
    currentValue = currentValue * (1 + change);
    performanceData.push({ date, value: currentValue });
  }

  // Generate benchmark data (market performance)
  const benchmarkData: { date: string; value: number }[] = [];
  let benchmarkValue = params.initialCapital;
  for (let i = 0; i <= days; i++) {
    const date = startDate.add(i, 'day').format('YYYY-MM-DD');
    // Market with slight upward trend
    const change = (Math.random() - 0.49) * 0.015;
    benchmarkValue = benchmarkValue * (1 + change);
    benchmarkData.push({ date, value: benchmarkValue });
  }

  // Generate mock positions
  const positions = [
    {
      date: startDate.add(5, 'day').format('YYYY-MM-DD'),
      symbol: 'BTC/USDT',
      direction: 'LONG' as const,
      entry: 42500,
      exit: 44200,
      pnl: 510,
      pnlPercent: 4.0,
    },
    {
      date: startDate.add(15, 'day').format('YYYY-MM-DD'),
      symbol: 'BTC/USDT',
      direction: 'SHORT' as const,
      entry: 45000,
      exit: 43500,
      pnl: 450,
      pnlPercent: 3.33,
    },
    {
      date: startDate.add(25, 'day').format('YYYY-MM-DD'),
      symbol: 'ETH/USDT',
      direction: 'LONG' as const,
      entry: 2800,
      exit: 2650,
      pnl: -225,
      pnlPercent: -5.36,
    },
    {
      date: startDate.add(35, 'day').format('YYYY-MM-DD'),
      symbol: 'BTC/USDT',
      direction: 'LONG' as const,
      entry: 41000,
      exit: 43800,
      pnl: 840,
      pnlPercent: 6.83,
    },
  ];

  const finalValue = performanceData[performanceData.length - 1]?.value || params.initialCapital;
  const totalReturn = ((finalValue - params.initialCapital) / params.initialCapital) * 100;

  return {
    strategyId,
    params,
    metrics: {
      totalReturn,
      annualizedReturn: totalReturn * (365 / days),
      maxDrawdown: -8.5,
      sharpeRatio: 1.45,
      winRate: 75,
      totalTrades: positions.length,
    },
    performanceData,
    benchmarkData,
    positions,
  };
};
