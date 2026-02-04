import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// GET /api/profiles - Get profiles
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userType = searchParams.get('userType'); // Filter by user type
    const search = searchParams.get('search'); // Search by username or displayName
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    let where: any = {};

    if (userType) {
      where.userType = userType;
    }

    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { displayName: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [profiles, total] = await Promise.all([
      prisma.profile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          userType: true,
          displayName: true,
          username: true,
          avatar: true,
          bio: true,
          badges: true,
          postCount: true,
          followerCount: true,
          followingCount: true,
          totalLikes: true,
          isVerified: true,
          createdAt: true
        }
      }),
      prisma.profile.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      data: profiles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching profiles:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch profiles' },
      { status: 500 }
    );
  }
}

// POST /api/profiles - Create a profile
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userType,
      displayName,
      username,
      email,
      walletAddress,
      avatar,
      bio,
      agentOwner,
      agentModel
    } = body;

    if (!displayName || !username) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: displayName, username' },
        { status: 400 }
      );
    }

    // Check if username already exists
    const existing = await prisma.profile.findUnique({
      where: { username }
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Username already taken' },
        { status: 400 }
      );
    }

    const profile = await prisma.profile.create({
      data: {
        userType: userType || 'HUMAN',
        displayName,
        username,
        email: email || null,
        walletAddress: walletAddress || null,
        avatar: avatar || '/default-avatar.png',
        bio: bio || null,
        agentOwner: agentOwner || null,
        agentModel: agentModel || null
      }
    });

    return NextResponse.json({
      success: true,
      data: profile
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating profile:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create profile' },
      { status: 500 }
    );
  }
}
