const ASTERDEX_API_BASE = 'https://www.asterdex.com';

export interface KlineParams {
  symbol: string;
  interval: string;
  limit?: number;
  contractType?: string;
  startTime?: number;
  endTime?: number;
}

export interface KlineData {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
  quoteAssetVolume: string;
  numberOfTrades: number;
  takerBuyBaseAssetVolume: string;
  takerBuyQuoteAssetVolume: string;
}

/**
 * Fetch klines (candlestick) data from Asterdex
 * @param params - Query parameters
 * @returns Promise of klines data array
 */
export async function fetchKlines(params: KlineParams): Promise<KlineData[]> {
  const {
    symbol,
    interval,
    limit = 1000,
    contractType = 'PERPETUAL',
    startTime,
    endTime,
  } = params;

  const queryParams: Record<string, string> = {
    symbol,
    interval,
    limit: limit.toString(),
    contractType,
  };

  if (startTime !== undefined) {
    queryParams.startTime = startTime.toString();
  }
  if (endTime !== undefined) {
    queryParams.endTime = endTime.toString();
  }

  const url = `${ASTERDEX_API_BASE}/fapi/v1/klines?${new URLSearchParams(
    queryParams
  ).toString()}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Asterdex API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    // Transform array response to typed objects
    return data.map((item: any[]) => ({
      openTime: item[0],
      open: item[1],
      high: item[2],
      low: item[3],
      close: item[4],
      volume: item[5],
      closeTime: item[6],
      quoteAssetVolume: item[7],
      numberOfTrades: item[8],
      takerBuyBaseAssetVolume: item[9],
      takerBuyQuoteAssetVolume: item[10],
    }));
  } catch (error) {
    console.error('Failed to fetch klines:', error);
    throw error;
  }
}

/**
 * Convert Asterdex kline data to Lightweight Charts candlestick format
 */
export function convertToChartData(klines: KlineData[]) {
  return klines.map((kline) => ({
    time: Math.floor(kline.openTime / 1000), // Convert to seconds
    open: parseFloat(kline.open),
    high: parseFloat(kline.high),
    low: parseFloat(kline.low),
    close: parseFloat(kline.close),
  }));
}
