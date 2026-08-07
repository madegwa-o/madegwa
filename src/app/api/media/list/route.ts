import { NextRequest, NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const folder = searchParams.get('folder') || 'coseke';
    const resourceType = searchParams.get('type') || 'image';
    const maxResults = parseInt(searchParams.get('maxResults') || '100');

    const resources = await cloudinary.api.resources({
      type: 'upload',
      prefix: folder,
      max_results: maxResults,
      resource_type: resourceType,
    });

    return NextResponse.json(resources, { status: 200 });
  } catch (error) {
    console.error('List error:', error);
    return NextResponse.json(
      { error: 'Failed to list resources' },
      { status: 500 }
    );
  }
}
