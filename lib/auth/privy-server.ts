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
 * @returns Identity token string (ID token, not access token)
 * @throws Error if token is missing
 */
function getIdentityTokenFromRequest(request: NextRequest): string | undefined {
  // Try Authorization header first (should contain ID token)
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Try various cookie names that Privy might use
  // Priority: ID token is required for server-side verification
  const possibleCookieNames = [
    'privy-id-token',      // Primary: ID token for server verification
    'privy-token',         // Legacy fallback
    'privy-access-token',  // Access token (not ideal, but try as fallback)
    'privy-session',       // Session fallback
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
    // This method validates the JWT signature and parses the user data
    const user = await privyClient.users().get({ id_token: token });

    if (!user || !user.id) {
      throw new Error('Unable to parse identity token - no user ID found');
    }

    return user;
  } catch (error) {
    if (error instanceof Error) {
      console.error('[Auth] Authentication error:', error.message);
    }
    throw new Error('Invalid or expired token');
  }
}
