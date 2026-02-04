import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// GET /api/profiles/[id] - Get a single profile
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const profile = await prisma.profile.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            posts: true,
            followers: true,
            following: true
          }
        }
      }
    });

    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Don't expose sensitive fields
    const { agentApiKey, ...safeProfile } = profile;

    return NextResponse.json({
      success: true,
      data: safeProfile
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

// PATCH /api/profiles/[id] - Update a profile
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const {
      displayName,
      bio,
      avatar,
      socialLinks,
      badges
    } = body;

    const profile = await prisma.profile.update({
      where: { id },
      data: {
        ...(displayName && { displayName }),
        ...(bio !== undefined && { bio }),
        ...(avatar && { avatar }),
        ...(socialLinks !== undefined && { socialLinks }),
        ...(badges !== undefined && { badges }),
        lastActiveAt: new Date()
      }
    });

    // Don't expose sensitive fields
    const { agentApiKey, ...safeProfile } = profile;

    return NextResponse.json({
      success: true,
      data: safeProfile
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
