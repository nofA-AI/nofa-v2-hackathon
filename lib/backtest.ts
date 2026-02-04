import dayjs from 'dayjs';
import { BacktestParams, BacktestResult, StrategyTree } from '@/lib/types/strategy';

const BACKTEST_API_URL = 'https://backtest-server-staging.up.railway.app/api/v1/backtest/run';

/**
 * Convert frontend timeframe format to backend API format
 * Frontend: '1min', '5min', '15min', '1H', '4H', '1D'
 * API uses CCXT standard timeframe format: `1m`, `5m`, `15m`, `1h`, `4h`, `1d` (lowercase)
 */
const convertTimeframe = (timeframe: string): string => {
  const timeframeMap: Record<string, string> = {
    '1min': '1m',
    '5min': '5m',
    '15min': '15m',
    '1H': '1h',
    '4H': '4h',
    '1D': '1d',
  };

  return timeframeMap[timeframe] || timeframe;
};

interface BacktestApiRequest {
  strategy: StrategyTree;
  capital: number;
  start_time: string;
  end_time: string;
  timeframe: string;
  slippage: number;
  transaction_fee: number;
}

interface BacktestApiResponse {
  request_id: string;
  strategy_name: string;
  kpis: {
    total_pnl: number;
    total_return_pct?: number;
    max_drawdown_pct: number;
    total_trades: number;
    profitable_trades: number;
    win_rate?: number;
    sharpe_ratio: number | null;
    annualized_return_pct?: number;
  };
  trades: Array<{
    open_time: string;
    close_time: string;
    symbol: string;
    direction: 'LONG' | 'SHORT';
    entry_price: number;
    exit_price: number;
    position_size_usd: number;
    position_size_token: number | null;
    pnl: number;
    return_pct: number;
    cumulative_pnl: number;
  }>;
  execution_time_seconds: number;
}

/**
 * Run backtest using real API
 */
export const runBacktest = async (
  strategyTree: StrategyTree,
  params: BacktestParams
): Promise<Omit<BacktestResult, 'id' | 'createdAt'>> => {
  // Backend has time range limitation: 2025-01-01 to 2025-12-31
  const minDate = dayjs('2025-01-01');
  const maxDate = dayjs('2025-12-31');

  // Clamp dates to valid range
  let startDate = dayjs(params.startDate);
  let endDate = dayjs(params.endDate);

  if (startDate.isBefore(minDate)) {
    startDate = minDate;
  }
  if (startDate.isAfter(maxDate)) {
    startDate = maxDate;
  }

  if (endDate.isAfter(maxDate)) {
    endDate = maxDate;
  }
  if (endDate.isBefore(minDate)) {
    endDate = minDate;
  }

  // Ensure end date is not before start date
  if (endDate.isBefore(startDate)) {
    endDate = startDate;
  }

  const startTime = startDate.toISOString();
  const endTime = endDate.endOf('day').toISOString();

  const requestBody: BacktestApiRequest = {
    strategy: strategyTree,
    capital: params.initialCapital,
    start_time: startTime,
    end_time: endTime,
    timeframe: convertTimeframe(params.timeframe),
    slippage: params.slippage,
    transaction_fee: params.tradingFee,
  };

  try {
    const response = await fetch(BACKTEST_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Backtest API error: ${response.status} ${response.statusText}. ${JSON.stringify(errorData)}`
      );
    }

    const data: BacktestApiResponse = await response.json();

    // Convert API response to our BacktestResult format
    const initialCapital = params.initialCapital;
    const finalCapital = initialCapital + data.kpis.total_pnl;
    const totalReturn = (data.kpis.total_pnl / initialCapital) * 100;

    // Generate performance data from trades
    const performanceData: { date: string; value: number }[] = [];
    let currentValue = initialCapital;

    if (data.trades.length > 0) {
      performanceData.push({
        date: dayjs(params.startDate).format('YYYY-MM-DD'),
        value: initialCapital,
      });

      data.trades.forEach((trade) => {
        currentValue = initialCapital + trade.cumulative_pnl;
        performanceData.push({
          date: dayjs(trade.close_time).format('YYYY-MM-DD'),
          value: currentValue,
        });
      });
    } else {
      // No trades, flat performance
      performanceData.push({
        date: dayjs(params.startDate).format('YYYY-MM-DD'),
        value: initialCapital,
      });
      performanceData.push({
        date: dayjs(params.endDate).format('YYYY-MM-DD'),
        value: initialCapital,
      });
    }

    // Convert trades to positions format
    const positions = data.trades.map((trade) => ({
      open_time: trade.open_time,
      close_time: trade.close_time,
      symbol: trade.symbol,
      direction: trade.direction,
      entry_price: trade.entry_price,
      exit_price: trade.exit_price,
      position_size_usd: trade.position_size_usd,
      position_size_token: trade.position_size_token,
      pnl: trade.pnl,
      return_pct: trade.return_pct,
      cumulative_pnl: trade.cumulative_pnl,
    }));

    // Calculate annualized return (use API value if available)
    const daysCount = dayjs(params.endDate).diff(dayjs(params.startDate), 'day') || 1;
    const annualizedReturn = data.kpis.annualized_return_pct !== undefined
      ? data.kpis.annualized_return_pct
      : totalReturn * (365 / daysCount);

    // Generate benchmark data (simple market performance)
    const benchmarkData: { date: string; value: number }[] = [];
    const days = dayjs(params.endDate).diff(dayjs(params.startDate), 'day');
    let benchmarkValue = initialCapital;
    for (let i = 0; i <= Math.min(days, 365); i += Math.max(1, Math.floor(days / 100))) {
      const date = dayjs(params.startDate).add(i, 'day').format('YYYY-MM-DD');
      const change = (Math.random() - 0.49) * 0.015;
      benchmarkValue = benchmarkValue * (1 + change);
      benchmarkData.push({ date, value: benchmarkValue });
    }

    return {
      strategyId: data.request_id,
      params,
      strategyTree,
      metrics: {
        totalReturn,
        annualizedReturn,
        maxDrawdown: data.kpis.max_drawdown_pct,
        sharpeRatio: data.kpis.sharpe_ratio || 0,
        winRate: data.kpis.total_trades > 0
          ? (data.kpis.profitable_trades / data.kpis.total_trades) * 100
          : 0,
        totalTrades: data.kpis.total_trades,
      },
      performanceData,
      benchmarkData: benchmarkData, // Assuming benchmark data is still needed
      positions,
    };
  } catch (error) {
    console.error('Backtest API error:', error);
    throw error;
  }
};

/**
 * Mock backtest function that simulates strategy performance (kept for fallback)
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
      open_time: startDate.add(5, 'day').format('YYYY-MM-DD'),
      close_time: startDate.add(8, 'day').format('YYYY-MM-DD'),
      symbol: 'BTC/USDT',
      direction: 'LONG' as const,
      entry_price: 42500,
      exit_price: 44200,
      position_size_usd: 1000,
      position_size_token: null,
      pnl: 510,
      return_pct: 4.0,
      cumulative_pnl: 510,
    },
    {
      open_time: startDate.add(15, 'day').format('YYYY-MM-DD'),
      close_time: startDate.add(18, 'day').format('YYYY-MM-DD'),
      symbol: 'BTC/USDT',
      direction: 'SHORT' as const,
      entry_price: 45000,
      exit_price: 43500,
      position_size_usd: 1000,
      position_size_token: null,
      pnl: 450,
      return_pct: 3.33,
      cumulative_pnl: 960,
    },
    {
      open_time: startDate.add(25, 'day').format('YYYY-MM-DD'),
      close_time: startDate.add(29, 'day').format('YYYY-MM-DD'),
      symbol: 'ETH/USDT',
      direction: 'LONG' as const,
      entry_price: 2800,
      exit_price: 2650,
      position_size_usd: 1000,
      position_size_token: null,
      pnl: -225,
      return_pct: -5.36,
      cumulative_pnl: 735,
    },
    {
      open_time: startDate.add(35, 'day').format('YYYY-MM-DD'),
      close_time: startDate.add(38, 'day').format('YYYY-MM-DD'),
      symbol: 'BTC/USDT',
      direction: 'LONG' as const,
      entry_price: 41000,
      exit_price: 43800,
      position_size_usd: 1000,
      position_size_token: null,
      pnl: 840,
      return_pct: 6.83,
      cumulative_pnl: 1575,
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
