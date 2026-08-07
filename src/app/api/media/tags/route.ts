import { NextRequest, NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { publicId, tags } = body;

    if (!publicId) {
      return NextResponse.json(
          { error: 'No publicId provided' },
          { status: 400 }
      );
    }

    if (!Array.isArray(tags)) {
      return NextResponse.json(
          { error: 'Tags must be an array' },
          { status: 400 }
      );
    }

    const result = await cloudinary.uploader.add_tag(tags.join(','), [publicId]);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Tags error:', error);
    return NextResponse.json(
        { error: 'Failed to update tags' },
        { status: 500 }
    );
  }
}