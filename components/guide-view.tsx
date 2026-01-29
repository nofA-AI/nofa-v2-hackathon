'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Zap,
  TrendingUp,
  Target,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowUp,
  Bolt,
  Code,
  History,
  MessageCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { recommendedStrategies, type RecommendedStrategy } from '@/lib/recommended-strategies';

interface NewsItem {
  id: string;
  title: string;
  content: string;
  time: string;
  sentiment?: 'Positive' | 'Negative' | 'Normal';
  source: string;
}

interface GuideViewProps {
  onNewsClick: (news: NewsItem) => void;
  onStrategyClick: (strategy: RecommendedStrategy) => void;
  onStartChat: () => void;
}

const NEWS_CACHE_TTL = 1000 * 60 * 10;
let cachedNews: NewsItem[] | null = null;
let cachedNewsAt = 0;

export function GuideView({
  onNewsClick,
  onStrategyClick,
  onStartChat,
}: GuideViewProps) {
  const [newsData, setNewsData] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [guideInput, setGuideInput] = useState('');

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    if (cachedNews && Date.now() - cachedNewsAt < NEWS_CACHE_TTL) {
      setNewsData(cachedNews);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        'https://api.theblockbeats.news/v1/open-api/open-flash?size=20&page=1&type=push&lang=en',
      );
      const data = await response.json();

      if (data.data?.data) {
        const formattedNews: NewsItem[] = data.data.data
          .slice(0, 8)
          .map((item: any) => ({
            id: item.id,
            title: item.title,
            content: stripHtml(item.content || item.description || ''),
            time: formatTime(item.create_time * 1000),
            sentiment: getSentiment(item.title + ' ' + item.content),
            source: 'BlockBeats',
          }));
        setNewsData(formattedNews);
        cachedNews = formattedNews;
        cachedNewsAt = Date.now();
      }
    } catch (error) {
      console.error('Failed to fetch news:', error);
      // Fallback to mock data
      const mockNews = getMockNews();
      setNewsData(mockNews);
      cachedNews = mockNews;
      cachedNewsAt = Date.now();
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const stripHtml = (text: string) => text.replace(/<[^>]*>/g, '').trim();

  const getSentiment = (text: string): 'Positive' | 'Negative' | 'Normal' => {
    const lowerText = text.toLowerCase();
    const positiveWords = [
      'surge',
      'rally',
      'gain',
      'up',
      'bullish',
      'breakthrough',
      'positive',
      'growth',
    ];
    const negativeWords = [
      'crash',
      'down',
      'drop',
      'fall',
      'bearish',
      'negative',
      'decline',
      'volatility',
    ];

    const hasPositive = positiveWords.some((word) => lowerText.includes(word));
    const hasNegative = negativeWords.some((word) => lowerText.includes(word));

    if (hasPositive && !hasNegative) return 'Positive';
    if (hasNegative && !hasPositive) return 'Negative';
    return 'Normal';
  };

  const getMockNews = (): NewsItem[] => [
    {
      id: '1',
      title: 'Bitcoin surges past $100K milestone',
      content:
        'Major cryptocurrency reaches historic high as institutional adoption accelerates.',
      time: '2h ago',
      sentiment: 'Positive',
      source: 'CryptoNews',
    },
    {
      id: '2',
      title: 'Ethereum upgrade boosts network efficiency',
      content:
        'Latest protocol update reduces gas fees and improves transaction speeds.',
      time: '4h ago',
      sentiment: 'Positive',
      source: 'BlockBeats',
    },
  ];

  const getSentimentBadge = (sentiment?: string) => {
    switch (sentiment) {
      case 'Positive':
        return (
          <Badge className="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 text-[9px] font-bold px-1.5 py-0.5 uppercase">
            Positive
          </Badge>
        );
      case 'Negative':
        return (
          <Badge className="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-[9px] font-bold px-1.5 py-0.5 uppercase">
            Negative
          </Badge>
        );
      default:
        return (
          <Badge className="bg-slate-100 text-slate-600 dark:bg-slate-700/50 dark:text-slate-300 text-[9px] font-bold px-1.5 py-0.5 uppercase">
            Normal
          </Badge>
        );
    }
  };

  const handleGuideSubmit = (event?: React.FormEvent) => {
    if (event) event.preventDefault();
    const text = guideInput.trim();
    if (!text) return;

    window.dispatchEvent(
      new CustomEvent('guide-chat-submit', { detail: { text } }),
    );
    setGuideInput('');
    onStartChat();
  };

  const handleNewsCardClick = (news: NewsItem) => {
    window.dispatchEvent(
      new CustomEvent('guide-chat-submit', {
        detail: {
          title: news.title,
          content: news.content
        }
      }),
    );
    onNewsClick(news);
    onStartChat();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 0 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 0 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col"
    >
      <div className="flex-1 overflow-y-auto custom-scrollbar pt-6 pb-48 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 mt-4">
            <h1 className="text-4xl font-extrabold mb-2 bg-gradient-to-r from-primary to-emerald-500 bg-clip-text text-transparent">
              What will you build today?
            </h1>
            <p className="text-muted-foreground text-base">
              Build and backtest quantitative trading strategies with AI
              assistance.
            </p>
          </div>

          {/* Happening Now Section */}
          <div className="w-full mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-lg">Happening Now</h3>
              </div>
              <div className="flex gap-2 !hidden">
                <button className="w-8 h-8 flex items-center justify-center rounded-full border hover:bg-accent transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button className="w-8 h-8 flex items-center justify-center rounded-full border hover:bg-accent transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto pb-4">
              <div className="flex gap-4 min-w-max">
                {loading
                  ? Array.from({ length: 4 }).map((_, index) => (
                      <div
                        key={index}
                        className="p-5 rounded-xl border bg-card h-52 w-80 flex flex-col"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Skeleton className="h-5 w-16" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                        <Skeleton className="h-6 w-full mb-2" />
                        <Skeleton className="h-6 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-full mb-1" />
                        <Skeleton className="h-4 w-5/6 mb-2" />
                        <div className="mt-auto flex items-center justify-end">
                          <Skeleton className="h-3 w-12" />
                        </div>
                      </div>
                    ))
                  : newsData.map((news) => (
                      <div
                        key={news.id}
                        onClick={() => handleNewsCardClick(news)}
                        className="p-5 rounded-xl border bg-card hover:shadow-lg hover:border-primary/20 transition-all cursor-pointer group h-52 w-80 flex flex-col"
                      >
                        <div className="flex items-center justify-between mb-2">
                          {getSentimentBadge(news.sentiment)}
                          <span className="text-[10px] text-muted-foreground">
                            {news.source}
                          </span>
                        </div>
                        <p className="font-bold text-base mb-2 group-hover:text-primary transition-colors line-clamp-3 leading-relaxed">
                          {news.title}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                          {news.content}
                        </p>
                        <div className="mt-auto flex items-center justify-end">
                          <span className="text-[10px] text-muted-foreground">
                            {news.time}
                          </span>
                        </div>
                      </div>
                    ))}
              </div>
            </div>
          </div>

          {/* Recommended Strategies Section */}
          <div className="w-full">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Recommended Strategies
            </h3>
            <div className="bg-card rounded-xl border divide-y overflow-hidden shadow-sm">
              {recommendedStrategies.map((strategy) => (
                <div
                  key={strategy.id}
                  onClick={() => onStrategyClick(strategy)}
                  className="p-4 flex items-center justify-between hover:bg-accent transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 flex-shrink-0 rounded-full bg-muted flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                      {strategy.icon === 'TrendingUp' && (
                        <TrendingUp className="w-5 h-5" />
                      )}
                      {strategy.icon === 'Target' && (
                        <Target className="w-5 h-5" />
                      )}
                      {strategy.icon === 'Zap' && <Zap className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-base truncate">
                        {strategy.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                        <Badge
                          variant="secondary"
                          className="text-[8px] uppercase font-bold"
                        >
                          {strategy.category}
                        </Badge>
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                        {strategy.description}
                      </p>
                    </div>
                    <div className="hidden md:flex flex-col items-end px-6">
                      <span className="text-[10px] font-bold text-emerald-500 mb-1">
                        {strategy.performance}
                      </span>
                      <svg className="w-24 h-8" viewBox="0 0 100 30">
                        <path
                          d={strategy.sparkline}
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="1.5"
                        />
                      </svg>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 z-40 pt-4 pb-6 px-8 bg-gradient-to-t from-background via-background/95 to-transparent dark:from-background-dark dark:via-background-dark/95 backdrop-blur-[12px]">
          <div className="max-w-4xl mx-auto">
            <form className="relative group" onSubmit={handleGuideSubmit}>
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <Sparkles className="h-5 w-5 text-primary/70" />
              </div>
              <input
                className="block w-full pl-14 pr-16 py-3.5 bg-white/80 dark:bg-surface-dark/80 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl dark:shadow-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary/30 text-base transition-all placeholder:text-slate-400 dark:text-white"
                placeholder="Ask NOFA AI to generate a strategy..."
                type="text"
                value={guideInput}
                onChange={(e) => setGuideInput(e.target.value)}
              />
              <div className="absolute inset-y-0 right-3 flex items-center">
                <button
                  type="submit"
                  className="bg-primary text-white w-9 h-9 rounded-xl hover:bg-emerald-800 transition-all shadow-md flex items-center justify-center hover:scale-105 active:scale-95"
                >
                  <ArrowUp className="h-5 w-5" />
                </button>
              </div>
            </form>
            <div className="flex flex-wrap items-center justify-center gap-4 mt-2">
              <button className="text-[11px] pointer-events-none text-slate-500 hover:text-primary font-medium flex items-center gap-1 transition-colors px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">
                <Bolt className="h-3.5 w-3.5" />
                Analyze Markets
              </button>
              <button className="text-[11px] pointer-events-none text-slate-500 hover:text-primary font-medium flex items-center gap-1 transition-colors px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">
                <Code className="h-3.5 w-3.5" />
                Generate Strategy
              </button>
              <button className="text-[11px] pointer-events-none text-slate-500 hover:text-primary font-medium flex items-center gap-1 transition-colors px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">
                <History className="h-3.5 w-3.5" />
                Backtest History
              </button>
              <button className="text-[11px] pointer-events-none text-slate-500 hover:text-primary font-medium flex items-center gap-1 transition-colors px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">
                <MessageCircle className="h-3.5 w-3.5" />
                Recent Chats
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
