'use client';

import React, { useEffect, useState } from 'react';
import { Lightning } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface NewsItem {
  id: string;
  type: 'NORMAL' | 'POSITIVE' | 'NEGATIVE';
  category: string;
  title: string;
  time: string;
}

const mockNews: NewsItem[] = [
  {
    id: '1',
    type: 'NORMAL',
    category: 'Macro',
    title: 'Fed Chair Powell signals potential rate pause in upcoming session.',
    time: '2 MINS AGO',
  },
  {
    id: '2',
    type: 'POSITIVE',
    category: 'Crypto',
    title: 'BTC Open Interest reaches yearly high on major exchanges.',
    time: '14 MINS AGO',
  },
  {
    id: '3',
    type: 'NEGATIVE',
    category: 'Equities',
    title: 'Tech sector sees heavy rotation into defensive assets.',
    time: '32 MINS AGO',
  },
];

const typeStyles = {
  NORMAL: 'bg-muted text-muted-foreground',
  POSITIVE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  NEGATIVE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export function NewsTickerSidebar() {
  const [news, setNews] = useState<NewsItem[]>(mockNews);

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
        {news.map((item, index) => (
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
            <span className="text-[10px] text-muted-foreground font-medium">{item.time}</span>
          </div>
        ))}
      </div>
      <button className="w-full py-3 text-xs font-bold text-primary border-t hover:bg-muted/50 transition-colors uppercase tracking-widest">
        View Full Terminal
      </button>
    </div>
  );
}
