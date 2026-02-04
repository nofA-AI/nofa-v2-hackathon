import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { authenticateRequest, checkOwnership } from '@/lib/auth/api-auth';

// GET /api/posts/[id] - Get a single post
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

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            username: true,
            avatar: true,
            badges: true,
            userType: true,
            isVerified: true,
            bio: true,
            followerCount: true,
            postCount: true
          }
        }
      }
    });

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      );
    }

    // Increment view count
    await prisma.post.update({
      where: { id: postId },
      data: { viewCount: { increment: 1 } }
    });

    // If user is authenticated, fetch their interactions with this post
    let isLiked = false;
    let isBookmarked = false;

    if (userId) {
      const interactions = await prisma.interaction.findMany({
        where: {
          userId: userId,
          targetType: 'POST',
          targetId: postId
        },
        select: {
          interactionType: true
        }
      });

      isLiked = interactions.some(i => i.interactionType === 'LIKE');
      isBookmarked = interactions.some(i => i.interactionType === 'BOOKMARK');
    }

    return NextResponse.json({
      success: true,
      data: {
        ...post,
        viewCount: post.viewCount + 1,
        isLiked,
        isBookmarked
      }
    });
  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch post' },
      { status: 500 }
    );
  }
}

// PATCH /api/posts/[id] - Update a post
export async function PATCH(
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

    // Check if post exists and user owns it
    const existingPost = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true }
    });

    if (!existingPost) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      );
    }

    // Check ownership
    const ownershipError = checkOwnership(userId!, existingPost.authorId);
    if (ownershipError) return ownershipError;

    const { title, content, strategyMetrics, media, tags, isPinned } = body;

    const post = await prisma.post.update({
      where: { id: postId },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(strategyMetrics !== undefined && { strategyMetrics }),
        ...(media !== undefined && { media }),
        ...(tags !== undefined && { tags }),
        ...(isPinned !== undefined && { isPinned }),
        isEdited: true,
        editedAt: new Date()
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

    return NextResponse.json({
      success: true,
      data: post
    });
  } catch (error) {
    console.error('Error updating post:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update post' },
      { status: 500 }
    );
  }
}

// DELETE /api/posts/[id] - Delete a post
export async function DELETE(
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

    if (isNaN(postId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid post ID' },
        { status: 400 }
      );
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true }
    });

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      );
    }

    // Check ownership
    const ownershipError = checkOwnership(userId!, post.authorId);
    if (ownershipError) return ownershipError;

    // Delete the post (comments and interactions will be cascade deleted)
    await prisma.post.delete({
      where: { id: postId }
    });

    // Decrement author's post count
    await prisma.profile.update({
      where: { id: post.authorId },
      data: { postCount: { decrement: 1 } }
    });

    return NextResponse.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete post' },
      { status: 500 }
    );
  }
}
