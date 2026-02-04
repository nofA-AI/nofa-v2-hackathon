import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { authenticateRequest } from '@/lib/auth/api-auth';

// GET /api/posts/[id]/comments - Get comments for a post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const postId = parseInt(id);

    if (isNaN(postId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid post ID' },
        { status: 400 }
      );
    }

    // Try to authenticate (optional for GET)
    const auth = await authenticateRequest(request);
    const userId = auth.error ? null : auth.userId;

    // Get top-level comments and their replies
    const comments = await prisma.comment.findMany({
      where: {
        postId,
        parentCommentId: null // Only top-level comments
      },
      orderBy: { timestamp: 'desc' },
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
        },
        replies: {
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
          },
          orderBy: { timestamp: 'asc' }
        }
      }
    });

    // If user is authenticated, fetch their interactions
    let userInteractions: Map<number, Set<string>> = new Map();
    if (userId) {
      const commentIds = comments.flatMap(c => [c.id, ...(c.replies?.map(r => r.id) || [])]);

      const interactions = await prisma.interaction.findMany({
        where: {
          userId: userId,
          targetType: 'COMMENT',
          targetId: { in: commentIds }
        },
        select: {
          targetId: true,
          interactionType: true
        }
      });

      // Build a map of comment ID to interaction types
      interactions.forEach(interaction => {
        if (!userInteractions.has(interaction.targetId)) {
          userInteractions.set(interaction.targetId, new Set());
        }
        userInteractions.get(interaction.targetId)!.add(interaction.interactionType);
      });
    }

    // Add interaction status to comments
    const commentsWithInteractions = comments.map(comment => ({
      ...comment,
      isLiked: userInteractions.get(comment.id)?.has('LIKE') || false,
      replies: comment.replies?.map(reply => ({
        ...reply,
        isLiked: userInteractions.get(reply.id)?.has('LIKE') || false,
      }))
    }));

    return NextResponse.json({
      success: true,
      data: commentsWithInteractions
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

// POST /api/posts/[id]/comments - Create a comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const auth = await authenticateRequest(request);
    if (auth.error) return auth.error;
    const { userId } = auth;

    const { id } = await params;
    const postId = parseInt(id);
    const body = await request.json();

    if (isNaN(postId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid post ID' },
        { status: 400 }
      );
    }

    const { content, parentCommentId, mentions } = body;

    if (!content) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: content' },
        { status: 400 }
      );
    }

    // Create comment with authenticated userId
    const comment = await prisma.comment.create({
      data: {
        postId,
        authorId: userId!,
        content,
        parentCommentId: parentCommentId || null,
        mentions: mentions || []
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

    // Update post comment count
    await prisma.post.update({
      where: { id: postId },
      data: { commentCount: { increment: 1 } }
    });

    return NextResponse.json({
      success: true,
      data: comment
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}
