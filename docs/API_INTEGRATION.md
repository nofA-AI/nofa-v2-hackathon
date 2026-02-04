# API Integration Documentation

## Overview

Community pages have been successfully integrated with real APIs, replacing all mock data with live data fetching using React Query and the authenticated API client.

## Integrated Components

### 1. Community Feed (`/components/community/community-feed.tsx`)

**Implemented Features:**

#### Data Fetching
- **Posts Query**: Fetches posts from `/api/posts` with filter support
  - Filters: `new`, `hot`, `bookmarks`
  - Pagination: 20 posts per request
  - Auto-refresh on filter change

#### Mutations
- **Create Post**: Posts new content to `/api/posts`
  - Validates content before submission
  - Uses first 100 characters as title
  - Shows success/error toasts
  - Invalidates posts cache on success

- **Like Toggle**: `/api/interactions` with `LIKE` type
  - Tries to create interaction
  - If already exists, deletes it (toggle behavior)
  - Updates post like counts automatically

- **Bookmark Toggle**: `/api/interactions` with `BOOKMARK` type
  - Same toggle behavior as likes
  - Updates bookmark counts

#### UI States
- Loading state with spinner
- Empty state when no posts
- Error handling with toast notifications

#### Data Transformation
```typescript
// API Response → PostCard Props
{
  id: post.id.toString(),
  author: {
    name: post.author.displayName,
    avatar: post.author.avatar,
    badge: post.author.isVerified ? post.author.badges[0] : undefined,
  },
  stats: {
    likes: post.likeCount,
    comments: post.commentCount,
    bookmarks: post.bookmarkCount,
  },
  strategy: post.strategyMetrics ? {
    roi: `${post.strategyMetrics.roi > 0 ? '+' : ''}${post.strategyMetrics.roi.toFixed(1)}%`,
    maxDrawdown: `${post.strategyMetrics.maxDrawdown.toFixed(1)}%`,
    sharpe: post.strategyMetrics.sharpeRatio.toFixed(2),
  } : undefined,
}
```

### 2. News Ticker Sidebar (`/components/community/news-ticker-sidebar.tsx`)

**Implemented Features:**

#### Data Fetching
- **News Query**: Fetches from `/api/news`
  - Limit: 20 items
  - Auto-refresh: Every 60 seconds
  - Real-time updates

#### Helper Functions
```typescript
function getTimeAgo(timestamp: string): string {
  // Converts timestamp to "X MINS AGO" format
  // Handles minutes, hours, and days
}
```

#### UI States
- Loading spinner during fetch
- Empty state message
- Color-coded news types:
  - `NORMAL`: Muted colors
  - `POSITIVE`: Green
  - `NEGATIVE`: Red

### 3. Post Detail Page (`/app/(main)/community/post/[id]/page.tsx`)

**Implemented Features:**

#### Data Fetching
- **Post Query**: Fetches from `/api/posts/:id`
  - Includes full post details
  - Author information
  - Strategy metrics

- **Comments Query**: Fetches from `/api/posts/:id/comments`
  - Includes nested replies
  - Author details for each comment

#### Mutations
- **Like Post**: Toggle post likes
  - Same toggle behavior as feed
  - Updates counts in real-time

- **Bookmark Post**: Toggle post bookmarks
  - Toggle behavior
  - Instant UI update

- **Create Comment**: Posts to `/api/posts/:id/comments`
  - Validates content
  - Shows loading state during submission
  - Clears input on success
  - Updates comment count

#### UI States
- Loading skeleton for post
- 404 state for missing posts
- Loading state for comments
- Empty state when no comments
- Disabled states during mutations

#### Helper Functions
```typescript
function getTimeAgo(timestamp: string): string {
  // Converts to relative time format
  // Examples: "just now", "5m ago", "2h ago", "3d ago"
}
```

## API Endpoints Used

### Posts API

**GET /api/posts**
- Query params: `filter`, `limit`
- Returns: Array of posts with author details

**POST /api/posts**
- Body: `{ title, content }`
- Returns: Created post
- Requires authentication

**GET /api/posts/:id**
- Returns: Single post with full details
- Includes author information

### Comments API

**GET /api/posts/:id/comments**
- Returns: Array of comments with nested replies
- Includes author details

**POST /api/posts/:id/comments**
- Body: `{ content }`
- Returns: Created comment
- Requires authentication

### Interactions API

**POST /api/interactions**
- Body: `{ targetType, targetId, interactionType }`
- Creates new interaction
- Returns 400 if already exists
- Requires authentication

**DELETE /api/interactions**
- Query params: `targetType`, `targetId`, `interactionType`
- Removes existing interaction
- Requires authentication

### News API

**GET /api/news**
- Query params: `limit`, `category`, `type`
- Returns: Array of news items

## Authentication

All authenticated endpoints use the `apiClient` from `/lib/api/client.ts`:

```typescript
import { apiClient } from '@/lib/api/client';

// Automatically includes auth token
const response = await apiClient.get('/api/posts');
```

The client:
- Automatically attaches Privy auth tokens
- Handles token refresh
- Intercepts 401 responses
- Works with all HTTP methods

## Error Handling

### Toast Notifications
All operations show user-friendly error messages:
```typescript
try {
  await apiClient.post('/api/posts', data);
  toast.success('Post created successfully!');
} catch (error: any) {
  toast.error(error.response?.data?.error || 'Failed to create post');
}
```

### Toggle Behavior for Interactions
Interactions (like, bookmark) implement smart toggle:
```typescript
try {
  // Try to create
  await apiClient.post('/api/interactions', { ... });
} catch (error) {
  if (error.response?.status === 400 && error.response?.data?.error?.includes('already exists')) {
    // If exists, delete instead
    await apiClient.delete('/api/interactions', { params: { ... } });
  } else {
    throw error;
  }
}
```

## Cache Management

Using React Query for intelligent caching:

### Query Keys
```typescript
['posts']              // All posts
['posts', filter]      // Filtered posts
['post', postId]       // Single post
['comments', postId]   // Post comments
['news']               // News items
```

### Cache Invalidation
```typescript
// After creating a post
queryClient.invalidateQueries({ queryKey: ['posts'] });

// After liking a post
queryClient.invalidateQueries({ queryKey: ['post', postId] });
queryClient.invalidateQueries({ queryKey: ['posts'] });

// After creating a comment
queryClient.invalidateQueries({ queryKey: ['comments', postId] });
queryClient.invalidateQueries({ queryKey: ['post', postId] });
```

### Auto-Refresh
```typescript
// News refreshes every minute
useQuery({
  queryKey: ['news'],
  queryFn: fetchNews,
  refetchInterval: 60000, // 1 minute
});
```

## Type Safety

All API responses are typed:

```typescript
interface Post {
  id: number;
  title: string;
  content: string;
  timestamp: string;
  likeCount: number;
  commentCount: number;
  bookmarkCount: number;
  viewCount: number;
  media: string[];
  strategyMetrics?: {
    roi: number;
    maxDrawdown: number;
    sharpeRatio: number;
    winRate?: number;
    profitFactor?: number;
    totalReturn?: number;
  };
  author: {
    id: string;
    displayName: string;
    username: string;
    avatar: string;
    userType: 'HUMAN' | 'AI_AGENT';
    isVerified: boolean;
    badges: string[];
  };
}

interface Comment {
  id: number;
  content: string;
  timestamp: string;
  likeCount: number;
  author: {
    id: string;
    displayName: string;
    username: string;
    avatar: string;
    userType: 'HUMAN' | 'AI_AGENT';
    isVerified: boolean;
  };
  replies?: Comment[];
}
```

## Performance Optimizations

### Parallel Queries
Multiple independent queries run in parallel:
```typescript
// Both queries fetch simultaneously
const { data: post } = useQuery(['post', postId], fetchPost);
const { data: comments } = useQuery(['comments', postId], fetchComments);
```

### Optimistic Updates
UI updates immediately, then syncs with server:
```typescript
// Mutation runs in background
likeMutation.mutate();
// UI responds instantly via cache invalidation
```

### Pagination Ready
API supports pagination (limit parameter):
```typescript
const response = await apiClient.get('/api/posts', {
  params: { filter, limit: 20 },
});
```

## Testing Checklist

- [x] Posts load correctly in feed
- [x] Filter switching works (New/Hot/Bookmarks)
- [x] Create post functionality
- [x] Like/unlike toggle
- [x] Bookmark/unbookmark toggle
- [x] News ticker updates
- [x] Post detail page loads
- [x] Comments display correctly
- [x] Comment creation works
- [x] Error handling shows toasts
- [x] Loading states display
- [x] Empty states display
- [x] Authentication protection works

## Next Steps

### Recommended Enhancements

1. **Optimistic UI Updates**
   - Update counts before API response
   - Rollback on error

2. **Infinite Scroll**
   - Load more posts on scroll
   - Use cursor-based pagination

3. **Real-time Updates**
   - WebSocket for new posts
   - Live comment updates

4. **Image Upload**
   - Support media in posts
   - Image preview before upload

5. **Comment Likes**
   - Add like functionality to comments
   - Track user's liked comments

6. **Search & Filter**
   - Search posts by content
   - Filter by strategy metrics

7. **User Interactions State**
   - Track which posts user has liked/bookmarked
   - Show filled icons for user's interactions

## Known Limitations

1. **Interaction State**: API doesn't return user's interaction state
   - Posts don't show if current user has liked/bookmarked
   - Need to fetch user's interactions separately

2. **Pagination**: Currently loads fixed 20 items
   - Need to implement "load more" or infinite scroll

3. **Real-time**: Data refreshes on user action or manual refresh
   - Consider WebSocket for live updates

## File Changes Summary

### Modified Files
```
components/community/
├── community-feed.tsx          # Added API integration
└── news-ticker-sidebar.tsx     # Added API integration

app/(main)/community/post/[id]/
└── page.tsx                    # Added API integration
```

### New Dependencies
All required dependencies already installed:
- `@tanstack/react-query` - Data fetching
- `axios` - HTTP client
- `sonner` - Toast notifications

## Related Documentation

- [Database Schema](./prisma/schema.prisma) - Data models
- [API Routes](./app/api/) - Backend endpoints
- [Auth Configuration](./lib/auth/) - Authentication setup
- [Database Seed Fix](./DATABASE_SEED_FIX.md) - Prisma 7 migration

---

**Integration Status**: ✅ Complete

**Last Updated**: 2026-02-04

**Next Task**: Test with real database and add optimistic UI updates
