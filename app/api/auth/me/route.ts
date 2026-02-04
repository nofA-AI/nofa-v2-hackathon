import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/privy-server';

interface EmailAccount {
  type: 'email';
  address: string;
  [key: string]: any;
}

interface WalletAccount {
  type: 'wallet' | 'smart_wallet';
  address: string;
  chain_type: string;
  [key: string]: any;
}

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser(request);

    // Extract email from linked accounts
    const emailAccount = user.linked_accounts.find((account: any) => account.type === 'email') as EmailAccount | undefined;
    const email = emailAccount?.address || null;

    // Extract wallet addresses from linked accounts
    const walletAccounts = user.linked_accounts.filter(
      (account: any) => account.type === 'wallet' || account.type === 'smart_wallet'
    ) as WalletAccount[];

    const wallets = walletAccounts.map((account) => ({
      address: account.address,
      type: account.type,
      chainType: account.chain_type,
    }));

    // Return user data
    return NextResponse.json({
      id: user.id,
      createdAt: user.created_at,
      email,
      wallets,
      hasAcceptedTerms: user.has_accepted_terms,
      isGuest: user.is_guest,
      linkedAccounts: user.linked_accounts,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Missing or invalid') || error.message.includes('Invalid or expired')) {
        return NextResponse.json(
          { error: 'Unauthorized: ' + error.message },
          { status: 401 }
        );
      }
    }

    console.error('[API /auth/me] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
