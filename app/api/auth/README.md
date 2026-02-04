# Authentication API

## Endpoints

### GET `/api/auth/me`

Returns the authenticated user's information.

**Authentication Methods:**

The API supports two authentication methods (checked in order):

1. **Authorization Header** (recommended for API calls):
   ```
   Authorization: Bearer <access_token>
   ```

2. **Cookies** (automatic in browser):
   - `privy-token`
   - `privy-access-token`

**Response:**
```json
{
  "id": "user_abc123",
  "createdAt": 1234567890,
  "email": "user@example.com",
  "wallets": [
    {
      "address": "0x1234...5678",
      "type": "wallet",
      "chainType": "ethereum"
    }
  ],
  "hasAcceptedTerms": true,
  "isGuest": false,
  "linkedAccounts": [...]
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token
- `500 Internal Server Error` - Server error

## Usage Examples

### Option 1: Use the provided React hook (Recommended)

```typescript
import { useUser } from '@/lib/hooks/use-user';

function MyComponent() {
  const { user, loading, error } = useUser();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <div>Welcome, {user?.email}!</div>;
}
```

### Option 2: Direct fetch (automatic cookie authentication)

```typescript
function MyComponent() {
  const fetchUser = async () => {
    // Cookies are automatically sent with the request
    const response = await fetch('/api/auth/me', {
      credentials: 'include', // Important for cookies
    });
    const user = await response.json();
    return user;
  };
}
```

### Option 3: Fetch with explicit token (for API calls)

```typescript
import { usePrivy } from '@privy-io/react-auth';

function MyComponent() {
  const { getAccessToken } = usePrivy();

  const fetchUser = async () => {
    const token = await getAccessToken();
    const response = await fetch('/api/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const user = await response.json();
    return user;
  };
}
```

## Environment Variables

Required environment variables (already configured in `.env.local`):

- `NEXT_PUBLIC_PRIVY_APP_ID` - Your Privy app ID
- `NEXT_PRIVY_APP_SECRET` - Your Privy app secret
- `PRIVY_VERIFICATION_KEY` - (Optional) Custom verification key. Defaults to Privy's JWKS URL.
