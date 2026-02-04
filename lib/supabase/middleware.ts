import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedUser } from "../auth/privy-server";

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({
    request,
  });

  // Define public paths that don't require authentication
  const publicPaths = [
    "/",
    "/login",
    "/auth",
    "/api/auth",
    "/_next",
    "/favicon.ico",
  ];

  // Check if the current path is public
  const isPublicPath = publicPaths.some((path) => {
    return request.nextUrl.pathname === path ||
           request.nextUrl.pathname.startsWith(path + "/");
  });

  // Skip authentication check for public paths
  if (isPublicPath) {
    return response;
  }

  // Check if Privy is configured
  if (!process.env.NEXT_PUBLIC_PRIVY_APP_ID || !process.env.NEXT_PRIVY_APP_SECRET) {
    console.warn('[Middleware] Privy environment variables not configured');
    return response;
  }

  // Try to authenticate the user with Privy
  try {
    const user = await getAuthenticatedUser(request);

    // User is authenticated, allow access
    if (user) {
      return response;
    }
  } catch (error) {
    // Authentication failed or token is missing/invalid
    // For now, we'll allow the request to proceed and let the client-side
    // AuthGuard handle the redirect to login
    // This prevents infinite redirect loops and allows the Privy client to initialize
    console.log('[Middleware] Authentication check failed:', error instanceof Error ? error.message : 'Unknown error');
  }

  return response;
}
