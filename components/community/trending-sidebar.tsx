'use client';

import React from 'react';
import { TrendUp } from '@phosphor-icons/react';
import Link from 'next/link';

interface TrendingTopic {
  id: string;
  category: string;
  commentCount: number | string;
  title: string;
}

const trendingTopics: TrendingTopic[] = [
  {
    id: '1',
    category: 'STRATEGY',
    commentCount: 45,
    title: 'Cross-exchange arbitrage on SOL ecosystem',
  },
  {
    id: '2',
    category: 'TECHNICAL',
    commentCount: 12,
    title: 'Rust vs C++ for high-frequency trading bot',
  },
  {
    id: '3',
    category: 'POLL',
    commentCount: '892 votes',
    title: 'Expected APY for Q4 Market Cycle?',
  },
];

export function TrendingSidebar() {
  return (
    <div className="sticky top-24 space-y-6">
      <div className="bg-card border rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-bold mb-6 flex items-center gap-2">
          <TrendUp className="text-green-500 text-xl" weight="bold" />
          Trending Discussion
        </h3>
        <div className="space-y-6">
          {trendingTopics.map((topic) => (
            <Link
              key={topic.id}
              href={`/community/post/${topic.id}`}
              className="block group"
            >
              <p className="text-[10px] text-muted-foreground font-bold mb-1 uppercase tracking-wider">
                {topic.category} • {topic.commentCount} {typeof topic.commentCount === 'number' ? 'comments' : ''}
              </p>
              <h4 className="text-sm font-semibold group-hover:text-primary transition-colors leading-snug">
                {topic.title}
              </h4>
            </Link>
          ))}
        </div>
        <div className="mt-8 pt-6 border-t">
          <div className="text-[11px] text-muted-foreground flex flex-wrap gap-x-4 gap-y-2">
            <Link href="/terms" className="hover:text-primary">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-primary">
              Privacy
            </Link>
            <span>© {new Date().getFullYear()} NOFA</span>
          </div>
        </div>
      </div>
    </div>
  );
}
