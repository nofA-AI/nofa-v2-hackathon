'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { PostCard } from './post-card';
import { useUser } from '@/lib/hooks/use-user';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import {
  Clock,
  Fire,
  Bookmark,
  ChartLine,
  Image as ImageIcon,
  VideoCamera,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { getAvatarUrl } from '@/lib/utils/avatar';

type FilterType = 'new' | 'hot' | 'bookmarks';

interface Post {
  id: number;
  title: string;
  content: string;
  timestamp: string;
  likeCount: number;
  commentCount: number;
  bookmarkCount: number;
  viewCount: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
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

export function CommunityFeed() {
  const { user, guard, authenticated } = useUser();
  const [filter, setFilter] = useState<FilterType>('hot');
  const [postContent, setPostContent] = useState('');
  const queryClient = useQueryClient();

  // Fetch posts based on filter
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['posts', filter],
    queryFn: async () => {
      const response = await apiClient.get('/api/posts', {
        params: { filter, limit: 20 },
      });
      return response.data.data;
    },
  });

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async (data: { title: string; content: string }) => {
      const response = await apiClient.post('/api/posts', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      setPostContent('');
      toast.success('Post created successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create post');
    },
  });

  const handlePostClick = () => {
    if (!guard()) return;
    if (!postContent.trim()) {
      toast.error('Please write something');
      return;
    }

    createPostMutation.mutate({
      title: postContent.slice(0, 100), // Use first 100 chars as title
      content: postContent,
    });
  };

  const likeMutation = useMutation({
    mutationFn: async ({ postId, isLiked }: { postId: number; isLiked: boolean }) => {
      if (isLiked) {
        await apiClient.delete('/api/interactions', {
          params: {
            targetType: 'POST',
            targetId: postId,
            interactionType: 'LIKE',
          },
        });
      } else {
        await apiClient.post('/api/interactions', {
          targetType: 'POST',
          targetId: postId,
          interactionType: 'LIKE',
        });
      }
    },
    onMutate: async ({ postId, isLiked }) => {
      await queryClient.cancelQueries({ queryKey: ['posts', filter] });

      const previousPosts = queryClient.getQueryData(['posts', filter]);

      queryClient.setQueryData(['posts', filter], (old: Post[] | undefined) => {
        if (!old) return old;
        return old.map((post) => {
          if (post.id !== postId) return post;
          return {
            ...post,
            isLiked: !isLiked,
            likeCount: isLiked ? post.likeCount - 1 : post.likeCount + 1,
          };
        });
      });

      return { previousPosts };
    },
    onError: (error: any, variables, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(['posts', filter], context.previousPosts);
      }
      toast.error(error.response?.data?.error || 'Failed to toggle like');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['posts', filter] });
    },
  });

  const bookmarkMutation = useMutation({
    mutationFn: async ({ postId, isBookmarked }: { postId: number; isBookmarked: boolean }) => {
      if (isBookmarked) {
        await apiClient.delete('/api/interactions', {
          params: {
            targetType: 'POST',
            targetId: postId,
            interactionType: 'BOOKMARK',
          },
        });
      } else {
        await apiClient.post('/api/interactions', {
          targetType: 'POST',
          targetId: postId,
          interactionType: 'BOOKMARK',
        });
      }
    },
    onMutate: async ({ postId, isBookmarked }) => {
      await queryClient.cancelQueries({ queryKey: ['posts', filter] });

      const previousPosts = queryClient.getQueryData(['posts', filter]);

      queryClient.setQueryData(['posts', filter], (old: Post[] | undefined) => {
        if (!old) return old;
        return old.map((post) => {
          if (post.id !== postId) return post;
          return {
            ...post,
            isBookmarked: !isBookmarked,
            bookmarkCount: isBookmarked ? post.bookmarkCount - 1 : post.bookmarkCount + 1,
          };
        });
      });

      return { previousPosts };
    },
    onError: (error: any, variables, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(['posts', filter], context.previousPosts);
      }
      toast.error(error.response?.data?.error || 'Failed to toggle bookmark');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['posts', filter] });
    },
  });

  const handleLikeClick = (postId: number, isLiked: boolean) => {
    if (!guard()) return;
    likeMutation.mutate({ postId, isLiked });
  };

  const handleBookmarkClick = (postId: number, isBookmarked: boolean) => {
    if (!guard()) return;
    bookmarkMutation.mutate({ postId, isBookmarked });
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-xl font-bold">Community Feed</h1>
        <div className="flex gap-2">
          <Button
            variant={filter === 'new' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilter('new')}
            className="flex items-center gap-1.5"
          >
            <Clock className="w-[18px] h-[18px]" weight="bold" />
            New
          </Button>
          <Button
            variant={filter === 'hot' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilter('hot')}
            className="flex items-center gap-1.5"
          >
            <Fire className="w-[18px] h-[18px]" weight="fill" />
            Hot
          </Button>
          <Button
            variant={filter === 'bookmarks' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilter('bookmarks')}
            className="flex items-center gap-1.5"
          >
            <Bookmark className="w-[18px] h-[18px]" weight="bold" />
            Bookmarks
          </Button>
        </div>
      </div>

      {/* Post Creation Box */}
      <div className="bg-card border rounded-xl overflow-hidden shadow-sm transition-all focus-within:ring-1 focus-within:ring-primary/20">
        <div className="p-4 flex gap-4">
          <div className="size-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
            {user ? (
              <span className="text-sm font-bold text-primary">
                {user.email?.[0]?.toUpperCase() || 'U'}
              </span>
            ) : (
              <span className="text-sm font-bold text-muted-foreground">?</span>
            )}
          </div>
          <div className="flex-1">
            <Textarea
              placeholder="What's on your mind?"
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              onClick={() => guard()}
              className="min-h-[40px] border-none p-0 focus-visible:ring-0 bg-transparent resize-none"
            />
          </div>
        </div>
        <div className="px-4 py-3 bg-muted/50 border-t flex items-center justify-between">
          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => guard()}
              className="flex items-center gap-2 text-muted-foreground hover:text-primary"
            >
              <ChartLine className="w-5 h-5" weight="bold" />
              <span className="text-xs font-semibold">Strategy</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => guard()}
              className="flex items-center gap-2 text-muted-foreground hover:text-primary"
            >
              <ImageIcon className="w-5 h-5" weight="bold" />
              <span className="text-xs font-semibold">Image</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => guard()}
              className="flex items-center gap-2 text-muted-foreground hover:text-primary"
            >
              <VideoCamera className="w-5 h-5" weight="bold" />
              <span className="text-xs font-semibold">Video</span>
            </Button>
          </div>
          <Button onClick={handlePostClick} size="sm" className="font-bold">
            Post
          </Button>
        </div>
      </div>

      {/* Feed Posts */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
            <p className="mt-4 text-sm text-muted-foreground">Loading posts...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 bg-card border rounded-xl">
            <p className="text-muted-foreground">No posts found</p>
            {authenticated && (
              <p className="text-sm text-muted-foreground mt-2">
                Be the first to share something!
              </p>
            )}
          </div>
        ) : (
          posts.map((post: Post) => {
            // Transform API data to PostCard format
            const transformedPost = {
              id: post.id.toString(),
              author: {
                name: post.author.displayName,
                avatar: getAvatarUrl(
                  post.author.id || post.author.displayName,
                  post.author.userType
                ),
                badge: post.author.isVerified ? post.author.badges[0] : undefined,
              },
              title: post.title,
              content: post.content,
              timestamp: new Date(post.timestamp).toLocaleDateString(),
              stats: {
                likes: post.likeCount,
                comments: post.commentCount,
                bookmarks: post.bookmarkCount,
              },
              isLiked: post.isLiked,
              isBookmarked: post.isBookmarked,
              strategy: post.strategyMetrics
                ? {
                    roi: `${Number(post.strategyMetrics.roi) > 0 ? '+' : ''}${Number(post.strategyMetrics.roi).toFixed(1)}%`,
                    maxDrawdown: `${Number(post.strategyMetrics.maxDrawdown).toFixed(1)}%`,
                    sharpe: Number(post.strategyMetrics.sharpeRatio).toFixed(2),
                  }
                : undefined,
              image: post.media[0],
            };

            return (
              <PostCard
                key={post.id}
                post={transformedPost}
                onLike={() => handleLikeClick(post.id, post.isLiked || false)}
                onBookmark={() => handleBookmarkClick(post.id, post.isBookmarked || false)}
              />
            );
          })
        )}
      </div>
    </>
  );
}
