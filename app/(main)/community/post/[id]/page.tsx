'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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

// Mock data - in real app, fetch from API
const mockPost = {
  id: '1',
  author: {
    name: 'QuantMaster',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD858AEeWnm4L8i_8YwMwEZOxDYZl8GiV7ThWcHAR1b6q0I5lRpLONvLleLGeiKaNAknzgPwDlWXK-0Y1mTE-CzFkj3lFj6mn7PbpF6ufIC31Q4kJ-kehrcM5YWoEG6XDBGq7QCfa3GurzDtfwLQ_ZqMvqg-ArrFqhBVB0WsN7zfoDGh5BEmyj_WIAwsA7AmBQ0MZZEc-fF4GNsEsrG3ujpV5IhgY1odODGC_7TexaT-3P5MTCmDA5CLCj8LZlYh0TGSShKatbj97w',
    badge: 'Verified Strategist',
  },
  title: 'Neural Net Momentum v3.2 - Live Performance Update',
  content: `After the recent volatility in the ETH/BTC pair, the new RSI-based threshold filter has significantly reduced false signals. The backtest results match our live execution logs with 98% precision.

We've observed that the model tends to perform exceptionally well during high-volatility regimes where trend identification is crucial. The current version incorporates a multi-layer perception architecture that weighs volume profiles more heavily than previous iterations.

Key improvements in v3.2:
- Enhanced RSI filtering mechanism
- Volume-weighted trend detection
- Reduced false positive rate by 40%
- Improved Sharpe ratio from 2.8 to 3.12

The strategy has been running live for 30 days with consistent results. Looking forward to community feedback before rolling out v4.`,
  timestamp: '2h ago',
  stats: {
    likes: 124,
    comments: 18,
    bookmarks: 32,
  },
  strategy: {
    roi: '+14.2%',
    maxDrawdown: '-2.1%',
    sharpe: '3.12',
  },
};

const mockComments = [
  {
    id: '1',
    author: {
      name: 'AlphaResearcher',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCXio4FFdO65Y3csDLe0ajAAsIk2cF0VGJCCnpjqCQq0NsJ2JpnJuCMuZO4lOqkTYtE5SR-5vJvW-bnDKL3q8XZMjNYkK1kceMHXqzhW7TK5yb9B1OZzGBvF-t-bQueySkjFHB7sOiqpba0Q2H75uSRl-S4QzQ19DwNCA-hVaPV6aMVg7crCGNQxppu1PkBHLuCzRkBdVUryTqwbVZjSuWAULx8lH9lbWZanHrFbjtg4I5H2DfUOUaadYOXDJ8KcThgcpDRlMqrV3U',
    },
    content: 'Excellent breakdown. Have you tested this against the recent flash crash on the 14th? I\'m curious if the RSI filter would have triggered a stop or if it stayed in the trade.',
    timestamp: '1h ago',
    likes: 12,
    isLiked: true,
  },
  {
    id: '2',
    author: {
      name: 'TraderJoe_88',
      avatar: null,
    },
    content: 'Just added this to my paper trading account. The Sharpe ratio looks very promising for a momentum strategy.',
    timestamp: '45m ago',
    likes: 4,
    isLiked: false,
    replies: [
      {
        id: '2-1',
        author: {
          name: 'QuantMaster',
          avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD858AEeWnm4L8i_8YwMwEZOxDYZl8GiV7ThWcHAR1b6q0I5lRpLONvLleLGeiKaNAknzgPwDlWXK-0Y1mTE-CzFkj3lFj6mn7PbpF6ufIC31Q4kJ-kehrcM5YWoEG6XDBGq7QCfa3GurzDtfwLQ_ZqMvqg-ArrFqhBVB0WsN7zfoDGh5BEmyj_WIAwsA7AmBQ0MZZEc-fF4GNsEsrG3ujpV5IhgY1odODGC_7TexaT-3P5MTCmDA5CLCj8LZlYh0TGSShKatbj97w',
        },
        content: '@TraderJoe_88 Thanks! Keep us posted on the paper trading results. We\'re looking for more community feedback before the v4 update.',
        timestamp: '10m ago',
        likes: 0,
      },
    ],
  },
];

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, guard } = useUser();
  const postId = params.id as string;

  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likes, setLikes] = useState(mockPost.stats.likes);
  const [bookmarks, setBookmarks] = useState(mockPost.stats.bookmarks);
  const [comment, setComment] = useState('');

  const handleLike = () => {
    if (!guard()) return;
    setIsLiked(!isLiked);
    setLikes(prev => isLiked ? prev - 1 : prev + 1);
  };

  const handleBookmark = () => {
    if (!guard()) return;
    setIsBookmarked(!isBookmarked);
    setBookmarks(prev => isBookmarked ? prev - 1 : prev + 1);
  };

  const handleComment = () => {
    if (!guard()) return;
    if (!comment.trim()) return;
    console.log('Post comment:', comment);
    setComment('');
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-10 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.back()}
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
              {mockPost.author.avatar ? (
                <div
                  className="size-12 rounded-full bg-cover bg-center shrink-0"
                  style={{ backgroundImage: `url(${mockPost.author.avatar})` }}
                />
              ) : (
                <div className="size-12 rounded-full bg-primary flex items-center justify-center text-white shrink-0">
                  <span className="text-lg font-bold">{mockPost.author.name[0]}</span>
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-bold">{mockPost.author.name}</h4>
                  <span className="text-xs text-muted-foreground">{mockPost.timestamp}</span>
                </div>
                {mockPost.author.badge && (
                  <p className="text-xs text-primary font-medium">{mockPost.author.badge}</p>
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <DotsThree className="w-5 h-5" weight="bold" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Report Post</DropdownMenuItem>
                  <DropdownMenuItem>Share</DropdownMenuItem>
                  <DropdownMenuItem>Copy Link</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold mb-4 leading-tight">
              {mockPost.title}
            </h1>

            {/* Content */}
            <div className="prose prose-sm max-w-none mb-6">
              {mockPost.content.split('\n\n').map((paragraph, index) => (
                <p key={index} className="text-base leading-relaxed text-foreground mb-4">
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Strategy Stats */}
            {mockPost.strategy && (
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
                    <p className="text-lg font-bold text-green-600">{mockPost.strategy.roi}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-tight mb-1">
                      Max DD
                    </p>
                    <p className="text-lg font-bold text-red-500">{mockPost.strategy.maxDrawdown}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-tight mb-1">
                      Sharpe
                    </p>
                    <p className="text-lg font-bold">{mockPost.strategy.sharpe}</p>
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
                  className={cn(
                    'flex items-center gap-2 text-sm font-medium',
                    isLiked ? 'text-primary' : 'text-muted-foreground hover:text-primary'
                  )}
                >
                  <Heart className="w-6 h-6" weight={isLiked ? 'fill' : 'bold'} />
                  <span className="font-medium">{likes}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
                >
                  <ChatCircle className="w-6 h-6" weight="bold" />
                  <span className="font-medium">{mockPost.stats.comments}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBookmark}
                  className={cn(
                    'flex items-center gap-2 text-sm font-medium',
                    isBookmarked ? 'text-primary' : 'text-muted-foreground hover:text-primary'
                  )}
                >
                  <Bookmark className="w-6 h-6" weight={isBookmarked ? 'fill' : 'bold'} />
                  <span className="font-medium">{bookmarks}</span>
                </Button>
              </div>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                <Share className="w-5 h-5" weight="bold" />
              </Button>
            </div>
          </div>
        </article>

        {/* Comments Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold px-1">Comments ({mockPost.stats.comments})</h3>

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
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleComment} size="sm" disabled={!comment.trim()}>
                Post Comment
              </Button>
            </div>
          </div>

          {/* Comments List */}
          <div className="bg-card border rounded-xl p-5 shadow-sm space-y-6">
            {mockComments.map((commentItem) => (
              <div key={commentItem.id} className="space-y-4">
                <div className="flex gap-4">
                  {commentItem.author.avatar ? (
                    <div
                      className="size-10 shrink-0 rounded-full bg-cover bg-center"
                      style={{ backgroundImage: `url(${commentItem.author.avatar})` }}
                    />
                  ) : (
                    <div className="size-10 shrink-0 rounded-full bg-primary flex items-center justify-center text-white">
                      <span className="text-sm font-bold">{commentItem.author.name[0]}</span>
                    </div>
                  )}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{commentItem.author.name}</span>
                      <span className="text-[11px] text-muted-foreground">• {commentItem.timestamp}</span>
                    </div>
                    <p className="text-sm leading-relaxed">{commentItem.content}</p>
                    <div className="flex items-center gap-4 pt-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          'text-xs font-bold h-auto py-1 px-0',
                          commentItem.isLiked ? 'text-primary' : 'text-muted-foreground hover:text-primary'
                        )}
                      >
                        {commentItem.isLiked ? 'Liked' : 'Like'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs font-bold text-muted-foreground hover:text-primary h-auto py-1 px-0"
                      >
                        Reply
                      </Button>
                      {commentItem.likes > 0 && (
                        <div className="flex items-center gap-1 text-primary">
                          <Heart className="w-3 h-3" weight="fill" />
                          <span className="text-[10px] font-bold">{commentItem.likes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Replies */}
                {commentItem.replies?.map((reply) => (
                  <div key={reply.id} className="flex gap-4 ml-12">
                    {reply.author.avatar ? (
                      <div
                        className="size-8 shrink-0 rounded-full bg-cover bg-center"
                        style={{ backgroundImage: `url(${reply.author.avatar})` }}
                      />
                    ) : (
                      <div className="size-8 shrink-0 rounded-full bg-primary flex items-center justify-center text-white">
                        <span className="text-xs font-bold">{reply.author.name[0]}</span>
                      </div>
                    )}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">{reply.author.name}</span>
                        <span className="text-[11px] text-muted-foreground">• {reply.timestamp}</span>
                      </div>
                      <p className="text-sm leading-relaxed">{reply.content}</p>
                      <div className="flex items-center gap-4 pt-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs font-bold text-muted-foreground hover:text-primary h-auto py-1 px-0"
                        >
                          Like
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs font-bold text-muted-foreground hover:text-primary h-auto py-1 px-0"
                        >
                          Reply
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
