'use client';

import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Heart,
  ChatCircle,
  Bookmark,
  ArrowLeft,
  Share,
  DotsThree,
  CaretDown,
  ChartBar,
  Rocket,
  ChatTeardropDots,
} from '@phosphor-icons/react';
import { useUser } from '@/lib/hooks/use-user';
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';
import { getAvatarUrl } from '@/lib/utils/avatar';

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

interface Comment {
  id: number;
  content: string;
  timestamp: string;
  likeCount: number;
  isLiked?: boolean;
  parentCommentId?: number | null;
  mentions?: string[];
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

interface PostDetailClientProps {
  postId: string;
  initialPost?: Post;
}

export default function PostDetailClient({ postId, initialPost }: PostDetailClientProps) {
  const router = useRouter();
  const { user, guard } = useUser();
  const queryClient = useQueryClient();

  const [comment, setComment] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const [replyTargetId, setReplyTargetId] = useState<number | null>(null);
  const [replyToLabel, setReplyToLabel] = useState<string | null>(null);
  const [replyToUserId, setReplyToUserId] = useState<string | null>(null);
  const [replyTargetAnchorId, setReplyTargetAnchorId] = useState<string | null>(null);
  const commentsSectionRef = useRef<HTMLDivElement | null>(null);

  // Fetch post details
  const { data: post, isLoading: postLoading } = useQuery<Post>({
    queryKey: ['post', postId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/posts/${postId}`);
      return response.data.data;
    },
    initialData: initialPost,
  });

  // Fetch comments
  const { data: comments = [], isLoading: commentsLoading } = useQuery<Comment[]>({
    queryKey: ['comments', postId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/posts/${postId}/comments`);
      return response.data.data;
    },
  });

  // Like/unlike post mutation
  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!post) return;

      const isLiked = post.isLiked;

      if (isLiked) {
        await apiClient.delete('/api/interactions', {
          params: {
            targetType: 'POST',
            targetId: parseInt(postId),
            interactionType: 'LIKE',
          },
        });
      } else {
        await apiClient.post('/api/interactions', {
          targetType: 'POST',
          targetId: parseInt(postId),
          interactionType: 'LIKE',
        });
      }

      return { isLiked };
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['post', postId] });

      const previousPost = queryClient.getQueryData(['post', postId]);

      queryClient.setQueryData(['post', postId], (old: Post | undefined) => {
        if (!old) return old;
        return {
          ...old,
          isLiked: !old.isLiked,
          likeCount: old.isLiked ? old.likeCount - 1 : old.likeCount + 1,
        };
      });

      return { previousPost };
    },
    onError: (error: any, variables, context) => {
      if (context?.previousPost) {
        queryClient.setQueryData(['post', postId], context.previousPost);
      }
      toast.error(error.response?.data?.error || 'Failed to toggle like');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  // Bookmark/unbookmark post mutation
  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      if (!post) return;

      if (post.isBookmarked) {
        await apiClient.delete('/api/interactions', {
          params: {
            targetType: 'POST',
            targetId: parseInt(postId),
            interactionType: 'BOOKMARK',
          },
        });
      } else {
        await apiClient.post('/api/interactions', {
          targetType: 'POST',
          targetId: parseInt(postId),
          interactionType: 'BOOKMARK',
        });
      }
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['post', postId] });

      const previousPost = queryClient.getQueryData(['post', postId]);

      queryClient.setQueryData(['post', postId], (old: Post | undefined) => {
        if (!old) return old;
        return {
          ...old,
          isBookmarked: !old.isBookmarked,
          bookmarkCount: old.isBookmarked ? old.bookmarkCount - 1 : old.bookmarkCount + 1,
        };
      });

      return { previousPost };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    onError: (error: any, variables, context) => {
      if (context?.previousPost) {
        queryClient.setQueryData(['post', postId], context.previousPost);
      }
      toast.error(error.response?.data?.error || 'Failed to toggle bookmark');
    },
  });

  // Create comment mutation
  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiClient.post(`/api/posts/${postId}/comments`, {
        content,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      setComment('');
      toast.success('Comment posted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to post comment');
    },
  });

  // Create reply mutation
  const replyMutation = useMutation({
    mutationFn: async ({ content, parentCommentId, mentions }: { content: string; parentCommentId: number; mentions?: string[] }) => {
      const response = await apiClient.post(`/api/posts/${postId}/comments`, {
        content,
        parentCommentId,
        mentions,
      });
      return response.data.data as Comment;
    },
    onSuccess: (createdReply) => {
      queryClient.setQueryData(['comments', postId], (old: Comment[] | undefined) => {
        if (!old) return old;
        const parentId = createdReply.parentCommentId;
        if (!parentId) return old;
        return old.map((commentItem) => {
          if (commentItem.id !== parentId) return commentItem;
          return {
            ...commentItem,
            replies: [...(commentItem.replies || []), createdReply],
          };
        });
      });

      queryClient.setQueryData(['post', postId], (old: Post | undefined) => {
        if (!old) return old;
        return {
          ...old,
          commentCount: old.commentCount + 1,
        };
      });

      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      setReplyContent('');
      setReplyTargetId(null);
      setReplyToLabel(null);
      toast.success('Reply posted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to post reply');
    },
  });

  // Like/unlike comment mutation
  const commentLikeMutation = useMutation({
    mutationFn: async ({ commentId, isLiked }: { commentId: number; isLiked: boolean }) => {
      if (isLiked) {
        await apiClient.delete('/api/interactions', {
          params: {
            targetType: 'COMMENT',
            targetId: commentId,
            interactionType: 'LIKE',
          },
        });
      } else {
        await apiClient.post('/api/interactions', {
          targetType: 'COMMENT',
          targetId: commentId,
          interactionType: 'LIKE',
        });
      }
    },
    onMutate: async ({ commentId, isLiked }) => {
      await queryClient.cancelQueries({ queryKey: ['comments', postId] });

      const previousComments = queryClient.getQueryData(['comments', postId]);

      queryClient.setQueryData(['comments', postId], (old: Comment[] | undefined) => {
        if (!old) return old;
        return old.map((commentItem) => {
          if (commentItem.id === commentId) {
            return {
              ...commentItem,
              isLiked: !isLiked,
              likeCount: isLiked ? commentItem.likeCount - 1 : commentItem.likeCount + 1,
            };
          }

          if (!commentItem.replies?.length) return commentItem;

          return {
            ...commentItem,
            replies: commentItem.replies.map((reply) => {
              if (reply.id !== commentId) return reply;
              return {
                ...reply,
                isLiked: !isLiked,
                likeCount: isLiked ? reply.likeCount - 1 : reply.likeCount + 1,
              };
            }),
          };
        });
      });

      return { previousComments };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
    },
    onError: (error: any, variables, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData(['comments', postId], context.previousComments);
      }
      toast.error(error.response?.data?.error || 'Failed to toggle like');
    },
  });

  const handleLike = () => {
    if (!guard()) return;
    likeMutation.mutate();
  };

  const handleBookmark = () => {
    if (!guard()) return;
    bookmarkMutation.mutate();
  };

  const handleComment = () => {
    if (!guard()) return;
    if (!comment.trim()) {
      toast.error('Please write a comment');
      return;
    }
    commentMutation.mutate(comment);
  };

  const handleCommentLike = (commentId: number, isLiked: boolean) => {
    if (!guard()) return;
    commentLikeMutation.mutate({ commentId, isLiked });
  };

  const handleReplyClick = (
    parentCommentId: number,
    replyToName?: string,
    replyToId?: string,
    anchorId?: string
  ) => {
    if (!guard()) return;
    setReplyTargetId(parentCommentId);
    setReplyToLabel(replyToName || null);
    setReplyToUserId(replyToId || null);
    setReplyTargetAnchorId(anchorId || null);
    setReplyContent('');
  };

  const handleReplyCancel = () => {
    setReplyTargetId(null);
    setReplyToLabel(null);
    setReplyToUserId(null);
    setReplyTargetAnchorId(null);
    setReplyContent('');
  };

  const handleReplySubmit = () => {
    if (!guard()) return;
    if (!replyTargetId) return;
    if (!replyContent.trim()) {
      toast.error('Please write a reply');
      return;
    }
    replyMutation.mutate({
      content: replyContent.trim(),
      parentCommentId: replyTargetId,
      mentions: replyToUserId ? [replyToUserId] : undefined,
    });
  };

  const getReplyTargetName = (reply: Comment, parentComment: Comment) => {
    const mentionId = reply.mentions?.[0];
    if (!mentionId) return parentComment.author.displayName;
    if (mentionId === parentComment.author.id) return parentComment.author.displayName;
    const mentionedReplyAuthor = parentComment.replies?.find(
      (nested) => nested.author.id === mentionId
    )?.author.displayName;
    return mentionedReplyAuthor || parentComment.author.displayName;
  };

  const handleScrollToComments = () => {
    commentsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleReportPost = () => {
    toast.success('Report submitted. Thanks for helping keep the community safe.');
  };

  const handleSharePost = async () => {
    const shareUrl = `${window.location.origin}/community/post/${postId}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: post?.title || 'Community Post',
          url: shareUrl,
        });
        return;
      } catch {
        // fall through to clipboard
      }
    }
  };

  const handleCopyLink = async () => {
    const shareUrl = `${window.location.origin}/community/post/${postId}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleBackToFeed = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
      return;
    }
    router.push('/community');
  };

  function getTimeAgo(timestamp: string): string {
    const now = new Date();
    const past = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - past.getTime()) / 60000);

    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  }

  if (postLoading) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 md:px-10 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-20">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
            <p className="mt-4 text-sm text-muted-foreground">Loading post...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 md:px-10 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-20">
            <p className="text-lg text-muted-foreground">Post not found</p>
            <Button onClick={() => router.push('/community')} className="mt-4">
              Back to Feed
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-10 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={handleBackToFeed}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-5 h-5" weight="bold" />
          Back to Feed
        </Button>

        {/* Post Content */}
        <article className="bg-card border rounded-xl shadow-sm">
          <div className="p-6">
            {/* Author Info */}
            <div className="flex items-start gap-3 mb-6">
              <div
                className="size-12 rounded-full bg-cover bg-center shrink-0"
                style={{ backgroundImage: `url(${getAvatarUrl(post.author.id || post.author.displayName, post.author.userType)})` }}
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-bold">{post.author.displayName}</h4>
                  <span className="text-xs text-muted-foreground">{getTimeAgo(post.timestamp)}</span>
                </div>
                {post.author.isVerified && post.author.badges.length > 0 && (
                  <p className="text-xs text-primary font-medium">{post.author.badges[0]}</p>
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <DotsThree className="w-5 h-5" weight="bold" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleReportPost}>Report Post</DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSharePost}>Share</DropdownMenuItem>
                  <DropdownMenuItem onClick={handleCopyLink}>Copy Link</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold mb-4 leading-tight">
              {post.title}
            </h1>

            {/* Content */}
            <div className="prose prose-sm max-w-none mb-6">
              {post.content.split('\n\n').map((paragraph, index) => (
                <p key={index} className="text-base leading-relaxed text-foreground mb-4">
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Strategy Stats */}
            {post.strategyMetrics && (
              <div className="bg-muted border rounded-xl p-5 flex flex-col md:flex-row gap-6 items-center mb-8">
                <div className="w-full md:w-48 h-24 bg-card rounded-lg border flex items-center justify-center p-2">
                  <svg
                    className="w-full h-full text-green-500"
                    preserveAspectRatio="none"
                    viewBox="0 0 100 40"
                  >
                    <path
                      d="M0,35 Q10,30 20,32 T40,20 T60,25 T80,5 T100,10"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    />
                  </svg>
                </div>
                <div className="grid grid-cols-3 flex-1 gap-6 text-center md:text-left">
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-tight mb-1">
                      30D ROI
                    </p>
                    <p className={cn(
                      "text-lg font-bold",
                      Number(post.strategyMetrics.roi) > 0 ? "text-green-600" : "text-red-500"
                    )}>
                      {Number(post.strategyMetrics.roi) > 0 ? '+' : ''}{Number(post.strategyMetrics.roi).toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-tight mb-1">
                      Max DD
                    </p>
                    <p className="text-lg font-bold text-red-500">
                      {Number(post.strategyMetrics.maxDrawdown).toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-tight mb-1">
                      Sharpe
                    </p>
                    <p className="text-lg font-bold">{Number(post.strategyMetrics.sharpeRatio).toFixed(2)}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="default" className="w-full md:w-auto font-bold flex items-center gap-2">
                      Add Strategy
                      <CaretDown className="w-4 h-4" weight="bold" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem className="flex items-center gap-3">
                      <ChartBar className="w-5 h-5 text-primary" weight="bold" />
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm">Backtest Strategy</span>
                        <span className="text-xs text-muted-foreground">Run historical backtest</span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex items-center gap-3">
                      <Rocket className="w-5 h-5 text-primary" weight="bold" />
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm">Deploy Strategy</span>
                        <span className="text-xs text-muted-foreground">Deploy to live trading</span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex items-center gap-3">
                      <ChatTeardropDots className="w-5 h-5 text-primary" weight="bold" />
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm">Discuss with AI</span>
                        <span className="text-xs text-muted-foreground">AI assistant analysis</span>
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            {/* Interaction Buttons */}
            <div className="flex items-center justify-between pt-6 border-t">
              <div className="flex items-center gap-8">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLike}
                  disabled={likeMutation.isPending}
                  className={cn(
                    "flex items-center gap-2 text-sm font-medium",
                    post.isLiked
                      ? "text-red-500 hover:text-red-600"
                      : "text-muted-foreground hover:text-primary"
                  )}
                >
                  <Heart
                    className="w-6 h-6"
                    weight={post.isLiked ? "fill" : "bold"}
                  />
                  <span className="font-medium">{post.likeCount}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleScrollToComments}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
                >
                  <ChatCircle className="w-6 h-6" weight="bold" />
                  <span className="font-medium">{post.commentCount}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBookmark}
                  disabled={bookmarkMutation.isPending}
                  className={cn(
                    "flex items-center gap-2 text-sm font-medium",
                    post.isBookmarked
                      ? "text-primary hover:text-primary"
                      : "text-muted-foreground hover:text-primary"
                  )}
                >
                  <Bookmark
                    className="w-6 h-6"
                    weight={post.isBookmarked ? "fill" : "bold"}
                  />
                  <span className="font-medium">{post.bookmarkCount}</span>
                </Button>
              </div>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                <Share className="w-5 h-5" weight="bold" />
              </Button>
            </div>
          </div>
        </article>

        {/* Comments Section */}
        <div ref={commentsSectionRef} className="space-y-4">
          <h3 className="text-lg font-bold px-1">Comments ({post.commentCount})</h3>

          {/* Comment Input */}
          <div className="bg-card border rounded-xl p-5 shadow-sm">
            <div className="flex gap-3 mb-4">
              <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
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
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  onClick={() => guard()}
                  placeholder="Write a comment..."
                  className="min-h-[60px] resize-none"
                  disabled={commentMutation.isPending}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                onClick={handleComment}
                size="sm"
                disabled={!comment.trim() || commentMutation.isPending}
              >
                {commentMutation.isPending ? 'Posting...' : 'Post Comment'}
              </Button>
            </div>
          </div>

          {/* Comments List */}
          {commentsLoading ? (
            <div className="bg-card border rounded-xl p-8 text-center">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
              <p className="mt-2 text-xs text-muted-foreground">Loading comments...</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="bg-card border rounded-xl p-8 text-center">
              <p className="text-sm text-muted-foreground">No comments yet. Be the first to comment!</p>
            </div>
          ) : (
            <div className="bg-card border rounded-xl p-5 shadow-sm space-y-6">
              {comments.map((commentItem) => (
                <div key={commentItem.id} className="space-y-4">
                  <div className="flex gap-4">
                    <div
                      className="size-10 shrink-0 rounded-full bg-cover bg-center"
                      style={{ backgroundImage: `url(${getAvatarUrl(commentItem.author.id || commentItem.author.displayName, commentItem.author.userType)})` }}
                    />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">{commentItem.author.displayName}</span>
                        <span className="text-[11px] text-muted-foreground">• {getTimeAgo(commentItem.timestamp)}</span>
                      </div>
                      <p className="text-sm leading-relaxed">{commentItem.content}</p>
                      <div className="flex items-center gap-4 pt-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCommentLike(commentItem.id, commentItem.isLiked || false)}
                          disabled={commentLikeMutation.isPending}
                          className={cn(
                            "text-xs font-bold h-auto py-1 px-0 flex items-center gap-1",
                            commentItem.isLiked
                              ? "text-primary hover:text-primary"
                              : "text-muted-foreground hover:text-primary"
                          )}
                        >
                          <Heart
                            className="w-3.5 h-3.5"
                            weight={commentItem.isLiked ? "fill" : "regular"}
                          />
                          <span>{commentItem.isLiked ? 'Liked' : 'Like'}</span>
                          {commentItem.likeCount > 0 && (
                            <span className="ml-0.5">({commentItem.likeCount})</span>
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleReplyClick(
                              commentItem.id,
                              commentItem.author.displayName,
                              commentItem.author.id,
                              `comment-${commentItem.id}`
                            )
                          }
                          className="text-xs font-bold text-muted-foreground hover:text-primary h-auto py-1 px-0"
                        >
                          Reply
                        </Button>
                      </div>
                      {replyTargetId === commentItem.id && replyTargetAnchorId === `comment-${commentItem.id}` && (
                        <div className="mt-3 rounded-lg border bg-muted/40 p-3">
                          {replyToLabel && (
                            <p className="text-[11px] text-muted-foreground mb-2">
                              Replying to {replyToLabel}
                            </p>
                          )}
                          <Textarea
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            onClick={() => guard()}
                            placeholder="Write a reply..."
                            className="min-h-[60px] resize-none bg-white"
                            disabled={replyMutation.isPending}
                          />
                          <div className="mt-2 flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleReplyCancel}
                              disabled={replyMutation.isPending}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={handleReplySubmit}
                              disabled={!replyContent.trim() || replyMutation.isPending}
                            >
                              {replyMutation.isPending ? 'Replying...' : 'Post Reply'}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Replies */}
                  {commentItem.replies?.map((reply) => (
                    <div key={reply.id} className="flex gap-4 ml-12">
                      <div
                        className="size-8 shrink-0 rounded-full bg-cover bg-center"
                        style={{ backgroundImage: `url(${getAvatarUrl(reply.author.id || reply.author.displayName, reply.author.userType)})` }}
                      />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold">{reply.author.displayName}</span>
                          <span className="text-[11px] text-muted-foreground">• {getTimeAgo(reply.timestamp)}</span>
                        </div>
                        {reply.mentions?.length ? (
                          <p className="text-[11px] text-muted-foreground">
                            Replying to {getReplyTargetName(reply, commentItem)}
                          </p>
                        ) : null}
                        <p className="text-sm leading-relaxed">{reply.content}</p>
                        <div className="flex items-center gap-4 pt-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCommentLike(reply.id, reply.isLiked || false)}
                            disabled={commentLikeMutation.isPending}
                            className={cn(
                              "text-xs font-bold h-auto py-1 px-0 flex items-center gap-1",
                              reply.isLiked
                                ? "text-primary hover:text-primary"
                                : "text-muted-foreground hover:text-primary"
                            )}
                          >
                            <Heart
                              className="w-3.5 h-3.5"
                              weight={reply.isLiked ? "fill" : "regular"}
                            />
                            <span>{reply.isLiked ? 'Liked' : 'Like'}</span>
                            {reply.likeCount > 0 && (
                              <span className="ml-0.5">({reply.likeCount})</span>
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleReplyClick(
                                commentItem.id,
                                reply.author.displayName,
                                reply.author.id,
                                `reply-${reply.id}`
                              )
                            }
                            className="text-xs font-bold text-muted-foreground hover:text-primary h-auto py-1 px-0"
                          >
                            Reply
                          </Button>
                        </div>
                        {replyTargetId === commentItem.id && replyTargetAnchorId === `reply-${reply.id}` && (
                          <div className="mt-3 rounded-lg border bg-muted/40 p-3">
                            {replyToLabel && (
                              <p className="text-[11px] text-muted-foreground mb-2">
                                Replying to {replyToLabel}
                              </p>
                            )}
                            <Textarea
                              value={replyContent}
                              onChange={(e) => setReplyContent(e.target.value)}
                              onClick={() => guard()}
                              placeholder="Write a reply..."
                              className="min-h-[60px] resize-none bg-white"
                              disabled={replyMutation.isPending}
                            />
                            <div className="mt-2 flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleReplyCancel}
                                disabled={replyMutation.isPending}
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                onClick={handleReplySubmit}
                                disabled={!replyContent.trim() || replyMutation.isPending}
                              >
                                {replyMutation.isPending ? 'Replying...' : 'Post Reply'}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
