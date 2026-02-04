import { createAuthenticatedClient } from './client';

const BACKTEST_API_URL = process.env.NEXT_PUBLIC_BACKTEST_API_URL || 'https://backtest-server-staging.up.railway.app/api/v1';

/**
 * Authenticated axios client for backtest API
 */
export const backtestClient = createAuthenticatedClient(BACKTEST_API_URL);
