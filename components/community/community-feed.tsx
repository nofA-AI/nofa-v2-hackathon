'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { PostCard } from './post-card';
import { useUser } from '@/lib/hooks/use-user';
import {
  Clock,
  Fire,
  Bookmark,
  ChartLine,
  Image as ImageIcon,
  VideoCamera,
} from '@phosphor-icons/react';

type FilterType = 'new' | 'hot' | 'bookmarks';

const mockPosts = [
  {
    id: '1',
    author: {
      name: 'QuantMaster',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD858AEeWnm4L8i_8YwMwEZOxDYZl8GiV7ThWcHAR1b6q0I5lRpLONvLleLGeiKaNAknzgPwDlWXK-0Y1mTE-CzFkj3lFj6mn7PbpF6ufIC31Q4kJ-kehrcM5YWoEG6XDBGq7QCfa3GurzDtfwLQ_ZqMvqg-ArrFqhBVB0WsN7zfoDGh5BEmyj_WIAwsA7AmBQ0MZZEc-fF4GNsEsrG3ujpV5IhgY1odODGC_7TexaT-3P5MTCmDA5CLCj8LZlYh0TGSShKatbj97w',
    },
    title: 'Neural Net Momentum v3.2 - Live Performance Update',
    content: 'After the recent volatility in the ETH/BTC pair, the new RSI-based threshold filter has significantly reduced false signals. The backtest results match our live execution logs with 98% precision.',
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
  },
  {
    id: '2',
    author: {
      name: 'NOFA_User_4921',
      avatar: null,
    },
    title: 'SOL/USDT local resistance breakdown?',
    content: 'Seeing some interesting divergence on the 4H timeframe. Price is testing the previous weekly high but volume is tapering off. Might see a pullback to the 20-day EMA before any further leg up.',
    timestamp: '5h ago',
    stats: {
      likes: 42,
      comments: 7,
      bookmarks: 12,
    },
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuANRBE35ltFeouHHOA_XX3ieU55Ifi7uArn2stkV9cdFQxERKY__aTchd8qpakGYegHO-tHe0h2IKYvUrkrzlStMVwfQwjmLcboL-DR9JvGanFZT-901TYGey9RjK0sHtLtlCWbJh-ufVyB1VLpVkKFF8WfGB-BGjHWSsbcu0DbobwAs57k0ACYhzvERpd_f7gbxnd3MGIL1X-Rl0ulQUX-ozK6A4oHATFLhW_RMMtclmT_51nQKO9FyXoeapTG-2jq55HL33PfLuo',
  },
];

export function CommunityFeed() {
  const { user, guard } = useUser();
  const [filter, setFilter] = useState<FilterType>('hot');
  const [postContent, setPostContent] = useState('');

  const handlePostClick = () => {
    if (!guard()) return;
    // Handle post creation
  };

  const handleLikeClick = () => {
    if (!guard()) return;
    // Handle like
  };

  const handleBookmarkClick = () => {
    if (!guard()) return;
    // Handle bookmark
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
        {mockPosts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onLike={handleLikeClick}
            onBookmark={handleBookmarkClick}
          />
        ))}
      </div>
    </>
  );
}
