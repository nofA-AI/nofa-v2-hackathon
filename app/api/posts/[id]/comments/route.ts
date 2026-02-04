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

    return NextResponse.json({
      success: true,
      data: comments
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
