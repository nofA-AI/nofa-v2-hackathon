import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PostDetailClient from './page-client';

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

async function getPost(id: string): Promise<Post | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/posts/${id}`, {
      cache: 'no-store', // Disable cache for fresh data
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching post:', error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const post = await getPost(id);

  if (!post) {
    return {
      title: 'Post Not Found',
      description: 'The requested post could not be found.',
    };
  }

  // Extract first paragraph for description
  const description = post.content.split('\n\n')[0] || post.content.substring(0, 160);
  const siteName = 'Trading Strategy Community';
  const url = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/community/post/${id}`;

  return {
    title: post.title,
    description: description,
    openGraph: {
      title: post.title,
      description: description,
      type: 'article',
      url: url,
      siteName: siteName,
      publishedTime: post.timestamp,
      authors: [post.author.displayName],
      ...(post.media && post.media.length > 0 && {
        images: [
          {
            url: post.media[0],
            width: 1200,
            height: 630,
            alt: post.title,
          },
        ],
      }),
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: description,
      ...(post.media && post.media.length > 0 && {
        images: [post.media[0]],
      }),
    },
    alternates: {
      canonical: url,
    },
  };
}

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getPost(id);

  if (!post) {
    notFound();
  }

  return <PostDetailClient postId={id} initialPost={post} />;
}
