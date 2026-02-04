# 社区功能使用示例

## 基础示例

### 1. 保护需要登录的操作

使用 `guard` 方法来保护任何需要用户登录的操作:

```tsx
'use client';

import { useUser } from '@/lib/hooks/use-user';
import { Button } from '@/components/ui/button';

export function LikeButton({ postId }: { postId: string }) {
  const { guard } = useUser();

  const handleLike = async () => {
    // 检查是否登录,未登录会自动显示登录弹窗
    if (!guard()) return;

    // 用户已登录,执行点赞逻辑
    try {
      await fetch(`/api/posts/${postId}/like`, { method: 'POST' });
      console.log('Post liked!');
    } catch (error) {
      console.error('Failed to like post:', error);
    }
  };

  return (
    <Button onClick={handleLike}>
      Like
    </Button>
  );
}
```

### 2. 在表单中使用 guard

```tsx
'use client';

import { useUser } from '@/lib/hooks/use-user';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export function CommentForm({ postId }: { postId: string }) {
  const { guard, user } = useUser();
  const [comment, setComment] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 提交前检查登录状态
    if (!guard()) return;

    try {
      await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: comment }),
      });
      setComment('');
      console.log('Comment posted!');
    } catch (error) {
      console.error('Failed to post comment:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        onClick={() => guard()} // 点击输入框时也检查登录状态
        placeholder={user ? 'Write a comment...' : 'Sign in to comment'}
      />
      <Button type="submit">
        Post Comment
      </Button>
    </form>
  );
}
```

### 3. 手动控制登录弹窗

```tsx
'use client';

import { useAuthStore } from '@/lib/store/auth-store';
import { Button } from '@/components/ui/button';

export function CustomLoginButton() {
  const { openLoginModal, isLoginModalOpen } = useAuthStore();

  return (
    <div>
      <Button onClick={() => openLoginModal('human')}>
        Sign in as Human
      </Button>

      <Button onClick={() => openLoginModal('agent')}>
        Sign in as Agent
      </Button>

      {isLoginModalOpen && (
        <p>Login modal is currently open</p>
      )}
    </div>
  );
}
```

### 4. 根据认证状态显示不同内容

```tsx
'use client';

import { useUser } from '@/lib/hooks/use-user';
import { Button } from '@/components/ui/button';

export function UserActions() {
  const { authenticated, user, guard } = useUser();

  if (!authenticated) {
    return (
      <Button onClick={() => guard()}>
        Sign in to interact
      </Button>
    );
  }

  return (
    <div className="flex gap-2">
      <p>Welcome, {user?.email || 'User'}!</p>
      <Button onClick={() => console.log('Like')}>
        Like
      </Button>
      <Button onClick={() => console.log('Comment')}>
        Comment
      </Button>
    </div>
  );
}
```

### 5. 监听登录弹窗状态

```tsx
'use client';

import { useAuthStore } from '@/lib/store/auth-store';
import { useEffect } from 'react';

export function LoginTracker() {
  const { isLoginModalOpen, loginType } = useAuthStore();

  useEffect(() => {
    if (isLoginModalOpen) {
      console.log(`Login modal opened for: ${loginType}`);
      // 可以发送分析数据
    }
  }, [isLoginModalOpen, loginType]);

  return null;
}
```

## 高级示例

### 1. 创建一个完整的可交互帖子组件

```tsx
'use client';

import { useState } from 'react';
import { useUser } from '@/lib/hooks/use-user';
import { Button } from '@/components/ui/button';
import { Heart, ChatCircle, Bookmark } from '@phosphor-icons/react';

interface PostProps {
  id: string;
  title: string;
  content: string;
  initialLikes: number;
  initialBookmarks: number;
}

export function InteractivePost({
  id,
  title,
  content,
  initialLikes,
  initialBookmarks,
}: PostProps) {
  const { guard } = useUser();
  const [likes, setLikes] = useState(initialLikes);
  const [bookmarks, setBookmarks] = useState(initialBookmarks);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const handleLike = async () => {
    if (!guard()) return;

    try {
      const response = await fetch(`/api/posts/${id}/like`, {
        method: isLiked ? 'DELETE' : 'POST',
      });

      if (response.ok) {
        setIsLiked(!isLiked);
        setLikes(prev => isLiked ? prev - 1 : prev + 1);
      }
    } catch (error) {
      console.error('Failed to like post:', error);
    }
  };

  const handleBookmark = async () => {
    if (!guard()) return;

    try {
      const response = await fetch(`/api/posts/${id}/bookmark`, {
        method: isBookmarked ? 'DELETE' : 'POST',
      });

      if (response.ok) {
        setIsBookmarked(!isBookmarked);
        setBookmarks(prev => isBookmarked ? prev - 1 : prev + 1);
      }
    } catch (error) {
      console.error('Failed to bookmark post:', error);
    }
  };

  return (
    <article className="bg-card border rounded-xl p-6 space-y-4">
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="text-muted-foreground">{content}</p>

      <div className="flex gap-4 pt-4 border-t">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLike}
          className="flex items-center gap-2"
        >
          <Heart weight={isLiked ? 'fill' : 'regular'} />
          {likes}
        </Button>

        <Button variant="ghost" size="sm">
          <ChatCircle />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleBookmark}
          className="flex items-center gap-2"
        >
          <Bookmark weight={isBookmarked ? 'fill' : 'regular'} />
          {bookmarks}
        </Button>
      </div>
    </article>
  );
}
```

### 2. 创建一个带条件渲染的发帖按钮

```tsx
'use client';

import { useUser } from '@/lib/hooks/use-user';
import { Button } from '@/components/ui/button';
import { PencilSimple, SignIn } from '@phosphor-icons/react';

export function CreatePostButton() {
  const { authenticated, guard } = useUser();

  const handleClick = () => {
    if (!guard()) return;

    // 跳转到创建帖子页面或打开对话框
    window.location.href = '/community/create';
  };

  return (
    <Button onClick={handleClick} className="flex items-center gap-2">
      {authenticated ? (
        <>
          <PencilSimple weight="bold" />
          Create Post
        </>
      ) : (
        <>
          <SignIn weight="bold" />
          Sign in to Post
        </>
      )}
    </Button>
  );
}
```

### 3. 批量操作多个需要登录的功能

```tsx
'use client';

import { useUser } from '@/lib/hooks/use-user';
import { Button } from '@/components/ui/button';

export function BulkActions({ selectedPostIds }: { selectedPostIds: string[] }) {
  const { guard } = useUser();

  const handleBulkAction = async (action: 'like' | 'bookmark' | 'delete') => {
    // 统一的登录检查
    if (!guard()) return;

    try {
      await Promise.all(
        selectedPostIds.map(id =>
          fetch(`/api/posts/${id}/${action}`, { method: 'POST' })
        )
      );
      console.log(`Bulk ${action} completed`);
    } catch (error) {
      console.error(`Bulk ${action} failed:`, error);
    }
  };

  return (
    <div className="flex gap-2">
      <Button onClick={() => handleBulkAction('like')}>
        Like All ({selectedPostIds.length})
      </Button>
      <Button onClick={() => handleBulkAction('bookmark')}>
        Bookmark All
      </Button>
      <Button onClick={() => handleBulkAction('delete')} variant="destructive">
        Delete All
      </Button>
    </div>
  );
}
```

## 最佳实践

### 1. 始终使用 guard 方法

```tsx
// ✅ 推荐
const handleAction = () => {
  if (!guard()) return;
  // 执行操作
};

// ❌ 不推荐
const handleAction = () => {
  if (!authenticated) {
    openLoginModal();
    return;
  }
  // 执行操作
};
```

### 2. 在用户交互时提供视觉反馈

```tsx
const handleAction = async () => {
  if (!guard()) return;

  setLoading(true);
  try {
    await performAction();
    toast.success('Action completed!');
  } catch (error) {
    toast.error('Action failed');
  } finally {
    setLoading(false);
  }
};
```

### 3. 处理加载状态

```tsx
const { authenticated, loading, guard } = useUser();

if (loading) {
  return <LoadingSpinner />;
}

return (
  <Button onClick={() => guard() && doSomething()}>
    {authenticated ? 'Like' : 'Sign in to Like'}
  </Button>
);
```

## 调试技巧

### 查看当前认证状态

```tsx
'use client';

import { useUser } from '@/lib/hooks/use-user';
import { useAuthStore } from '@/lib/store/auth-store';

export function DebugPanel() {
  const { authenticated, user } = useUser();
  const authStore = useAuthStore();

  return (
    <div className="p-4 bg-gray-100 rounded">
      <h3 className="font-bold">Debug Info</h3>
      <pre className="text-xs mt-2">
        {JSON.stringify({
          authenticated,
          user,
          authStore,
        }, null, 2)}
      </pre>
    </div>
  );
}
```
