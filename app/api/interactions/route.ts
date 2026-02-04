import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { authenticateRequest } from '@/lib/auth/api-auth';

// POST /api/interactions - Create an interaction (like, bookmark, share)
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const auth = await authenticateRequest(request);
    if (auth.error) return auth.error;
    const { userId } = auth;

    const body = await request.json();
    const { targetType, targetId, interactionType } = body;

    if (!targetType || !targetId || !interactionType) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: targetType, targetId, interactionType' },
        { status: 400 }
      );
    }

    // Check if interaction already exists
    const existing = await prisma.interaction.findUnique({
      where: {
        userId_targetType_targetId_interactionType: {
          userId: userId!,
          targetType,
          targetId,
          interactionType
        }
      }
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Interaction already exists' },
        { status: 400 }
      );
    }

    // Create interaction with authenticated userId
    const interaction = await prisma.interaction.create({
      data: {
        userId: userId!,
        targetType,
        targetId,
        interactionType
      }
    });

    // Update counts based on interaction type and target type
    if (targetType === 'POST') {
      const updateData: any = {};

      if (interactionType === 'LIKE') {
        updateData.likeCount = { increment: 1 };
        // Update author's total likes
        const post = await prisma.post.findUnique({
          where: { id: targetId },
          select: { authorId: true }
        });
        if (post) {
          await prisma.profile.update({
            where: { id: post.authorId },
            data: { totalLikes: { increment: 1 } }
          });
        }
      } else if (interactionType === 'BOOKMARK') {
        updateData.bookmarkCount = { increment: 1 };
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.post.update({
          where: { id: targetId },
          data: updateData
        });
      }
    } else if (targetType === 'COMMENT' && interactionType === 'LIKE') {
      await prisma.comment.update({
        where: { id: targetId },
        data: { likeCount: { increment: 1 } }
      });
    }

    return NextResponse.json({
      success: true,
      data: interaction
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating interaction:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create interaction' },
      { status: 500 }
    );
  }
}

// DELETE /api/interactions - Remove an interaction
export async function DELETE(request: NextRequest) {
  try {
    // Authenticate user
    const auth = await authenticateRequest(request);
    if (auth.error) return auth.error;
    const { userId } = auth;

    const searchParams = request.nextUrl.searchParams;
    const targetType = searchParams.get('targetType') as 'POST' | 'COMMENT';
    const targetId = parseInt(searchParams.get('targetId') || '0');
    const interactionType = searchParams.get('interactionType') as 'LIKE' | 'BOOKMARK' | 'SHARE';

    if (!targetType || !targetId || !interactionType) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters: targetType, targetId, interactionType' },
        { status: 400 }
      );
    }

    // Delete interaction for authenticated user
    const deleted = await prisma.interaction.delete({
      where: {
        userId_targetType_targetId_interactionType: {
          userId: userId!,
          targetType,
          targetId,
          interactionType
        }
      }
    });

    // Update counts
    if (targetType === 'POST') {
      const updateData: any = {};

      if (interactionType === 'LIKE') {
        updateData.likeCount = { decrement: 1 };
        // Update author's total likes
        const post = await prisma.post.findUnique({
          where: { id: targetId },
          select: { authorId: true }
        });
        if (post) {
          await prisma.profile.update({
            where: { id: post.authorId },
            data: { totalLikes: { decrement: 1 } }
          });
        }
      } else if (interactionType === 'BOOKMARK') {
        updateData.bookmarkCount = { decrement: 1 };
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.post.update({
          where: { id: targetId },
          data: updateData
        });
      }
    } else if (targetType === 'COMMENT' && interactionType === 'LIKE') {
      await prisma.comment.update({
        where: { id: targetId },
        data: { likeCount: { decrement: 1 } }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Interaction removed successfully'
    });
  } catch (error) {
    console.error('Error deleting interaction:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete interaction' },
      { status: 500 }
    );
  }
}
