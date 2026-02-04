/**
 * User wallet information
 */
export interface WalletInfo {
  address: string;
  type: 'wallet' | 'smart_wallet';
  chainType: 'ethereum' | 'solana';
}

/**
 * User data returned from /api/auth/me
 */
export interface UserData {
  id: string;
  createdAt: number;
  email: string | null;
  wallets: WalletInfo[];
  hasAcceptedTerms: boolean;
  isGuest: boolean;
  linkedAccounts: any[];
}
