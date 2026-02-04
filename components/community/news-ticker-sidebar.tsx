'use client';

import React from 'react';
import { Lightning } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

interface NewsItem {
  id: number;
  type: 'NORMAL' | 'POSITIVE' | 'NEGATIVE';
  category: string;
  title: string;
  timestamp: string;
}

const typeStyles = {
  NORMAL: 'bg-muted text-muted-foreground',
  POSITIVE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  NEGATIVE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

function getTimeAgo(timestamp: string): string {
  const now = new Date();
  const past = new Date(timestamp);
  const diffInMinutes = Math.floor((now.getTime() - past.getTime()) / 60000);

  if (diffInMinutes < 60) {
    return `${diffInMinutes} MINS AGO`;
  } else if (diffInMinutes < 1440) {
    const hours = Math.floor(diffInMinutes / 60);
    return `${hours} HOUR${hours > 1 ? 'S' : ''} AGO`;
  } else {
    const days = Math.floor(diffInMinutes / 1440);
    return `${days} DAY${days > 1 ? 'S' : ''} AGO`;
  }
}

export function NewsTickerSidebar() {
  const { data: news = [], isLoading } = useQuery({
    queryKey: ['news'],
    queryFn: async () => {
      const response = await apiClient.get('/api/news', {
        params: { limit: 20 },
      });
      return response.data.data;
    },
    refetchInterval: 60000, // Refetch every minute
  });

  return (
    <div className="sticky top-24 bg-card border rounded-xl overflow-hidden shadow-sm">
      <div className="p-4 border-b bg-muted/50 flex items-center justify-between">
        <h3 className="text-sm font-bold flex items-center gap-2">
          <Lightning className="text-primary text-xl" weight="fill" />
          Happening Now
        </h3>
        <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
      </div>
      <div className="max-h-[calc(100vh-250px)] overflow-y-auto">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
            <p className="mt-2 text-xs text-muted-foreground">Loading news...</p>
          </div>
        ) : news.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            No news available
          </div>
        ) : (
          news.map((item: NewsItem, index: number) => (
            <div
              key={item.id}
              className={cn(
                'p-4 hover:bg-muted/50 transition-colors cursor-pointer',
                index !== news.length - 1 && 'border-b'
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={cn(
                    'text-[9px] font-bold px-1.5 py-0.5 rounded uppercase',
                    typeStyles[item.type]
                  )}
                >
                  {item.type}
                </span>
                <p className="text-[10px] text-primary font-bold uppercase tracking-wider">
                  {item.category}
                </p>
              </div>
              <h4 className="text-sm font-medium leading-snug mb-2">{item.title}</h4>
              <span className="text-[10px] text-muted-foreground font-medium">
                {getTimeAgo(item.timestamp)}
              </span>
            </div>
          ))
        )}
      </div>
      <button className="w-full py-3 text-xs font-bold text-primary border-t hover:bg-muted/50 transition-colors uppercase tracking-widest">
        View Full Terminal
      </button>
    </div>
  );
}
