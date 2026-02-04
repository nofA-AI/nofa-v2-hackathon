'use client';

import React from 'react';
import { CommunityFeed } from '@/components/community/community-feed';
import { NewsTickerSidebar } from '@/components/community/news-ticker-sidebar';
import { TrendingSidebar } from '@/components/community/trending-sidebar';

export default function CommunityPage() {
  return (
    <main className="max-w-[1440px] mx-auto px-4 md:px-10 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Sidebar - News Ticker */}
        <aside className="lg:col-span-3 h-fit order-2 lg:order-1">
          <NewsTickerSidebar />
        </aside>

        {/* Center Content - Feed */}
        <section className="lg:col-span-6 space-y-6 order-1 lg:order-2">
          <CommunityFeed />
        </section>

        {/* Right Sidebar - Trending */}
        <aside className="lg:col-span-3 h-fit order-3">
          <TrendingSidebar />
        </aside>
      </div>
    </main>
  );
}
