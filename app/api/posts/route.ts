import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { authenticateRequest } from '@/lib/auth/api-auth';

// GET /api/posts - Get posts with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filter = searchParams.get('filter') || 'new'; // hot, new, bookmarks
    const userId = searchParams.get('userId'); // For bookmarks filter
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Try to authenticate (optional for GET)
    const auth = await authenticateRequest(request);
    const currentUserId = auth.error ? null : auth.userId;

    let orderBy: any = { timestamp: 'desc' }; // Default: new
    let where: any = {};

    // Apply filters
    if (filter === 'hot') {
      // Hot posts: sort by engagement (likes + comments + bookmarks)
      orderBy = [
        { isPinned: 'desc' },
        { likeCount: 'desc' },
        { commentCount: 'desc' }
      ];
    } else if (filter === 'bookmarks' && userId) {
      // Get bookmarked posts for user
      const bookmarks = await prisma.interaction.findMany({
        where: {
          userId,
          interactionType: 'BOOKMARK',
          targetType: 'POST'
        },
        select: { targetId: true }
      });

      const bookmarkedPostIds = bookmarks.map(b => b.targetId);
      where.id = { in: bookmarkedPostIds };
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          author: {
            select: {
              id: true,
              displayName: true,
              username: true,
              avatar: true,
              badges: true,
              userType: true,
              isVerified: true
            }
          }
        }
      }),
      prisma.post.count({ where })
    ]);

    // If user is authenticated, fetch their interactions with these posts
    let userInteractions: Map<number, Set<string>> = new Map();
    if (currentUserId) {
      const postIds = posts.map(p => p.id);

      const interactions = await prisma.interaction.findMany({
        where: {
          userId: currentUserId,
          targetType: 'POST',
          targetId: { in: postIds }
        },
        select: {
          targetId: true,
          interactionType: true
        }
      });

      // Build a map of post ID to interaction types
      interactions.forEach(interaction => {
        if (!userInteractions.has(interaction.targetId)) {
          userInteractions.set(interaction.targetId, new Set());
        }
        userInteractions.get(interaction.targetId)!.add(interaction.interactionType);
      });
    }

    // Add interaction status to posts
    const postsWithInteractions = posts.map(post => ({
      ...post,
      isLiked: userInteractions.get(post.id)?.has('LIKE') || false,
      isBookmarked: userInteractions.get(post.id)?.has('BOOKMARK') || false,
    }));

    return NextResponse.json({
      success: true,
      data: postsWithInteractions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

// POST /api/posts - Create a new post
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const auth = await authenticateRequest(request);
    if (auth.error) return auth.error;
    const { userId } = auth;

    const body = await request.json();
    const {
      title,
      content,
      strategyMetrics,
      media,
      tags
    } = body;

    // Validate required fields
    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: title, content' },
        { status: 400 }
      );
    }

    // Create post with authenticated userId
    const post = await prisma.post.create({
      data: {
        authorId: userId!,
        title,
        content,
        strategyMetrics: strategyMetrics || null,
        media: media || [],
        tags: tags || []
      },
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            username: true,
            avatar: true,
            badges: true,
            userType: true,
            isVerified: true
          }
        }
      }
    });

    // Update author's post count
    await prisma.profile.update({
      where: { id: userId! },
      data: { postCount: { increment: 1 } }
    });

    return NextResponse.json({
      success: true,
      data: post
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create post' },
      { status: 500 }
    );
  }
}
