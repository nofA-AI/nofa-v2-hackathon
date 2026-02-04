# Token Caching Optimization

## Problem

Previously, every API request would call `getIdentityToken()` from Privy, which triggers a network request to fetch the authentication token. This resulted in:
- Excessive network requests
- Poor performance
- Unnecessary load on Privy servers

## Solution

Implemented a token caching mechanism with automatic invalidation on 401 errors.

## How It Works

### 1. Token Caching (`lib/api/client.ts`)

```typescript
// Token is cached for 5 minutes
const TOKEN_CACHE_DURATION = 5 * 60 * 1000;

let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

async function getCachedToken(): Promise<string | null> {
  const now = Date.now();

  // Return cached token if still valid
  if (cachedToken && tokenExpiresAt > now) {
    return cachedToken;
  }

  // Token expired, fetch new one
  const token = await tokenGetter();
  if (token) {
    cachedToken = token;
    tokenExpiresAt = now + TOKEN_CACHE_DURATION;
  }

  return token;
}
```

### 2. Automatic Cache Invalidation

**On 401 Unauthorized:**
```typescript
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token cache
      clearTokenCache();

      // Notify React components
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
  }
);
```

**On User Logout:**
```typescript
// ApiClientProvider listens for logout and clears cache
useEffect(() => {
  if (ready && !authenticated) {
    clearTokenCache();
  }
}, [authenticated, ready]);
```

### 3. User Data Caching (`lib/hooks/use-user.ts`)

```typescript
const query = useQuery({
  queryKey: ['user'],
  queryFn: fetchUser,
  staleTime: 5 * 60 * 1000,  // Cache for 5 minutes
  gcTime: 10 * 60 * 1000,     // Keep in memory for 10 minutes
  retry: false,
});

// Listen for 401 events and clear user cache
useEffect(() => {
  const handleUnauthorized = () => {
    queryClient.invalidateQueries({ queryKey: ['user'] });
    queryClient.removeQueries({ queryKey: ['user'] });
  };

  window.addEventListener('auth:unauthorized', handleUnauthorized);
  return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
}, [queryClient]);
```

## Benefits

✅ **Performance**: Token is fetched once every 5 minutes instead of on every request
✅ **Reduced Network Usage**: Significantly fewer requests to Privy servers
✅ **Better UX**: Faster API responses due to reduced overhead
✅ **Automatic Invalidation**: Cache is cleared on 401 errors or logout
✅ **Graceful Degradation**: Falls back to cookie-based auth if token fetch fails

## Cache Durations

| Cache Type | Duration | Reason |
|------------|----------|--------|
| Token Cache | 5 minutes | Balance between freshness and performance |
| User Data (stale) | 5 minutes | Keep user data in sync with token |
| User Data (gc) | 10 minutes | Prevent unnecessary refetches on tab switches |

## Cache Invalidation Triggers

1. **401 Unauthorized Response**: Automatic invalidation via axios interceptor
2. **User Logout**: Cleared in `ApiClientProvider`
3. **Token Expiration**: Automatic after 5 minutes
4. **Manual Clear**: `clearTokenCache()` can be called explicitly

## Testing

To verify the optimization:

1. Open browser DevTools → Network tab
2. Login and navigate through the app
3. You should see:
   - Initial token fetch on login
   - No additional token fetches for 5 minutes
   - API requests still include the cached token
   - Token refresh after 5 minutes or on 401 error

## API

### `setTokenGetter(getter)`
Sets the function to fetch tokens from Privy.

### `clearTokenCache()`
Manually clears the cached token. Useful for testing or explicit logout.

### `getCachedToken()`
Internal function that returns cached token or fetches new one if expired.

## Migration Notes

No changes required in existing code. The caching is transparent to consumers of `apiClient`.
