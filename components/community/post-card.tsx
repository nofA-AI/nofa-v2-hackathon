'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Heart, ChatCircle, Bookmark, DotsThree, CaretDown, ChartBar, Rocket, ChatTeardropDots } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface PostAuthor {
  name: string;
  avatar: string | null;
}

interface PostStats {
  likes: number;
  comments: number;
  bookmarks: number;
}

interface PostStrategy {
  roi: string;
  maxDrawdown: string;
  sharpe: string;
}

interface Post {
  id: string;
  author: PostAuthor;
  title: string;
  content: string;
  timestamp: string;
  stats: PostStats;
  strategy?: PostStrategy;
  image?: string;
}

interface PostCardProps {
  post: Post;
  onLike: () => void;
  onBookmark: () => void;
}

export function PostCard({ post, onLike, onBookmark }: PostCardProps) {
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
    onLike();
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsBookmarked(!isBookmarked);
    onBookmark();
  };

  const handleCardClick = () => {
    router.push(`/community/post/${post.id}`);
  };

  return (
    <article
      className="bg-card border rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="p-5">
        {/* Author Info */}
        <div className="flex items-center gap-3 mb-4">
          {post.author.avatar ? (
            <div
              className="size-10 rounded-full bg-cover bg-center"
              style={{ backgroundImage: `url(${post.author.avatar})` }}
            />
          ) : (
            <div className="size-10 rounded-full bg-primary flex items-center justify-center text-white shrink-0">
              <span className="text-sm font-bold">{post.author.name[0]}</span>
            </div>
          )}
          <div className="flex-1 flex items-center gap-2">
            <h4 className="text-sm font-bold">{post.author.name}</h4>
            <span className="text-[11px] text-muted-foreground">{post.timestamp}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
            <DotsThree className="w-5 h-5" weight="bold" />
          </Button>
        </div>

        {/* Post Content */}
        <div className="block group">
          <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors">
            {post.title}
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed mb-4 line-clamp-2">
            {post.content}
          </p>
        </div>

        {/* Strategy Stats (if available) */}
        {post.strategy && (
          <div className="bg-muted border rounded-xl p-4 flex flex-col md:flex-row gap-6 items-center mb-4">
            <div className="w-full md:w-40 h-20 bg-card rounded-lg border flex items-center justify-center p-2">
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
            <div className="grid grid-cols-3 flex-1 gap-4 text-center md:text-left">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">
                  30D ROI
                </p>
                <p className="text-sm font-bold text-green-600">{post.strategy.roi}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">
                  Max DD
                </p>
                <p className="text-sm font-bold text-red-500">{post.strategy.maxDrawdown}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">
                  Sharpe
                </p>
                <p className="text-sm font-bold">{post.strategy.sharpe}</p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  className="w-full md:w-auto font-bold flex items-center gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  Add Strategy
                  <CaretDown className="w-4 h-4" weight="bold" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Backtest Strategy');
                  }}
                >
                  <ChartBar className="w-5 h-5 text-primary" weight="bold" />
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm">Backtest Strategy</span>
                    <span className="text-xs text-muted-foreground">Run historical backtest</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Deploy Strategy');
                  }}
                >
                  <Rocket className="w-5 h-5 text-primary" weight="bold" />
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm">Deploy Strategy</span>
                    <span className="text-xs text-muted-foreground">Deploy to live trading</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Discuss with AI');
                  }}
                >
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

        {/* Image (if available) */}
        {post.image && (
          <div className="rounded-xl overflow-hidden border mb-4">
            <img
              src={post.image}
              alt="Post attachment"
              className="w-full h-auto object-cover max-h-[300px] bg-muted"
            />
          </div>
        )}

        {/* Interaction Buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={cn(
                'flex items-center gap-1.5 text-sm font-medium',
                isLiked ? 'text-primary' : 'text-muted-foreground hover:text-primary'
              )}
            >
              <Heart
                className="w-5 h-5"
                weight={isLiked ? 'fill' : 'bold'}
              />
              {post.stats.likes + (isLiked ? 1 : 0)}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
            >
              <ChatCircle className="w-5 h-5" weight="bold" />
              {post.stats.comments}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBookmark}
              className={cn(
                'flex items-center gap-1.5 text-sm font-medium',
                isBookmarked ? 'text-primary' : 'text-muted-foreground hover:text-primary'
              )}
            >
              <Bookmark
                className="w-5 h-5"
                weight={isBookmarked ? 'fill' : 'bold'}
              />
              {post.stats.bookmarks + (isBookmarked ? 1 : 0)}
            </Button>
          </div>
          <span className="text-xs font-bold text-primary hover:underline" onClick={handleCardClick}>
            Read More
          </span>
        </div>
      </div>
    </article>
  );
}
