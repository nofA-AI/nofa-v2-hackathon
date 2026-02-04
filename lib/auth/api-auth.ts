import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from './privy-server';
import { prisma } from '@/lib/db/prisma';

/**
 * Authenticate API request and get user profile
 * @param request Next.js request object
 * @returns User profile with userId
 * @throws Returns NextResponse with error if authentication fails
 */
export async function authenticateRequest(request: NextRequest) {
  try {
    // Get authenticated user from Privy
    const privyUser = await getAuthenticatedUser(request) as any;

    if (!privyUser || !privyUser.id) {
      return {
        error: NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        )
      };
    }

    // Get or create user profile in database
    let profile = await prisma.profile.findUnique({
      where: { id: privyUser.id }
    });

    // If profile doesn't exist, create it
    if (!profile) {
      // Extract email and wallet from linked accounts
      const emailAccount = privyUser.linked_accounts?.find(
        (account: any) => account.type === 'email'
      );
      const walletAccount = privyUser.linked_accounts?.find(
        (account: any) => account.type === 'wallet'
      );

      const email = emailAccount?.address;
      const wallet = walletAccount?.address;

      profile = await prisma.profile.create({
        data: {
          id: privyUser.id,
          // 根据实际情况调整 userType
          userType: 'HUMAN',
          displayName: email?.split('@')[0] || wallet?.substring(0, 8) || 'User',
          username: `user_${privyUser.id.substring(0, 8)}`,
          email: email,
          walletAddress: wallet
        }
      });
    }

    return {
      userId: profile.id,
      profile
    };
  } catch (error) {
    console.error('[API Auth] Authentication failed:', error);
    return {
      error: NextResponse.json(
        { success: false, error: 'Authentication failed' },
        { status: 401 }
      )
    };
  }
}

/**
 * Check if user owns a resource
 * @param userId User ID
 * @param resourceOwnerId Resource owner ID
 * @returns Error response if user doesn't own resource
 */
export function checkOwnership(userId: string, resourceOwnerId: string) {
  if (userId !== resourceOwnerId) {
    return NextResponse.json(
      { success: false, error: 'Forbidden: You do not own this resource' },
      { status: 403 }
    );
  }
  return null;
}
