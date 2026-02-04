import { NextRequest } from 'next/server';
import { PrivyClient } from '@privy-io/node';

// Initialize Privy client
export const privyClient = new PrivyClient({
  appId: process.env.NEXT_PUBLIC_PRIVY_APP_ID || '',
  appSecret: process.env.NEXT_PRIVY_APP_SECRET || '',
});

/**
 * Get identity token from request headers or cookies
 * @param request Next.js request object
 * @returns Identity token string
 * @throws Error if token is missing
 */
function getIdentityTokenFromRequest(request: NextRequest): string | undefined {
  // Try Authorization header first
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Try various cookie names that Privy might use
  const possibleCookieNames = [
    'privy-id-token',
    'privy-token',
    'privy-access-token',
    'privy-session',
  ];

  for (const cookieName of possibleCookieNames) {
    const token = request.cookies.get(cookieName)?.value;
    if (token) {
      return token;
    }
  }

  return undefined;
}

/**
 * Get authenticated user from request
 * @param request Next.js request object
 * @returns User object from Privy
 * @throws Error if authentication fails
 */
export async function getAuthenticatedUser(request: NextRequest) {
  const token = getIdentityTokenFromRequest(request);

  if (!token) {
    throw new Error('Missing authorization token in header or cookie');
  }

  try {
    // Use Privy's users().get() method which verifies the token and returns the user
    const user = await privyClient.users().get({ id_token: token });
    return user;
  } catch (error) {
    if (error instanceof Error) {
      console.error('[Auth] Authentication error:', error.message);
    }
    throw new Error('Invalid or expired token');
  }
}
