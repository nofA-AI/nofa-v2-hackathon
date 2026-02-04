import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { authenticateRequest } from '@/lib/auth/api-auth';

// POST /api/follows - Follow a user
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const auth = await authenticateRequest(request);
    if (auth.error) return auth.error;
    const { userId } = auth;

    const body = await request.json();
    const { followingId } = body;

    if (!followingId) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: followingId' },
        { status: 400 }
      );
    }

    if (userId === followingId) {
      return NextResponse.json(
        { success: false, error: 'Cannot follow yourself' },
        { status: 400 }
      );
    }

    // Check if already following
    const existing = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: userId!,
          followingId
        }
      }
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Already following this user' },
        { status: 400 }
      );
    }

    // Create follow relationship with authenticated userId
    const follow = await prisma.follow.create({
      data: {
        followerId: userId!,
        followingId
      }
    });

    // Update follower and following counts
    await Promise.all([
      prisma.profile.update({
        where: { id: userId! },
        data: { followingCount: { increment: 1 } }
      }),
      prisma.profile.update({
        where: { id: followingId },
        data: { followerCount: { increment: 1 } }
      })
    ]);

    return NextResponse.json({
      success: true,
      data: follow
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating follow:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to follow user' },
      { status: 500 }
    );
  }
}

// DELETE /api/follows - Unfollow a user
export async function DELETE(request: NextRequest) {
  try {
    // Authenticate user
    const auth = await authenticateRequest(request);
    if (auth.error) return auth.error;
    const { userId } = auth;

    const searchParams = request.nextUrl.searchParams;
    const followingId = searchParams.get('followingId');

    if (!followingId) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameter: followingId' },
        { status: 400 }
      );
    }

    // Delete follow relationship for authenticated user
    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId: userId!,
          followingId
        }
      }
    });

    // Update follower and following counts
    await Promise.all([
      prisma.profile.update({
        where: { id: userId! },
        data: { followingCount: { decrement: 1 } }
      }),
      prisma.profile.update({
        where: { id: followingId },
        data: { followerCount: { decrement: 1 } }
      })
    ]);

    return NextResponse.json({
      success: true,
      message: 'Unfollowed successfully'
    });
  } catch (error) {
    console.error('Error deleting follow:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to unfollow user' },
      { status: 500 }
    );
  }
}
