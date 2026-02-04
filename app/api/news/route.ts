import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// GET /api/news - Get news items
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category'); // Filter by category
    const type = searchParams.get('type'); // Filter by type (POSITIVE, NEGATIVE, NORMAL)
    const limit = parseInt(searchParams.get('limit') || '10');

    let where: any = {};

    if (category) {
      where.category = category;
    }

    if (type) {
      where.type = type;
    }

    const news = await prisma.news.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit
    });

    return NextResponse.json({
      success: true,
      data: news
    });
  } catch (error) {
    console.error('Error fetching news:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch news' },
      { status: 500 }
    );
  }
}

// POST /api/news - Create a news item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      type,
      category,
      title,
      content,
      source,
      sourceUrl,
      relatedSymbols,
      sentiment
    } = body;

    if (!category || !title) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: category, title' },
        { status: 400 }
      );
    }

    const news = await prisma.news.create({
      data: {
        type: type || 'NORMAL',
        category,
        title,
        content: content || null,
        source: source || null,
        sourceUrl: sourceUrl || null,
        relatedSymbols: relatedSymbols || [],
        sentiment: sentiment || null
      }
    });

    return NextResponse.json({
      success: true,
      data: news
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating news:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create news' },
      { status: 500 }
    );
  }
}
