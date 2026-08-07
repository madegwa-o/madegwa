import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary - use CLOUDINARY_URL if available, otherwise individual env vars
const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'ddwpqrl4o';
const apiKey = process.env.CLOUDINARY_API_KEY || '691455968874128';
const apiSecret = process.env.CLOUDINARY_API_SECRET || process.env.CLOUDINARY_API_SECRET_2;

if (!cloudName || !apiKey || !apiSecret) {
  console.warn('[Cloudinary] Missing required configuration. Please set CLOUDINARY environment variables.');
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

export default cloudinary;

export interface CloudinaryResource {
  public_id: string;
  url: string;
  secure_url: string;
  resource_type: 'image' | 'video' | 'raw';
  type: string;
  format: string;
  width?: number;
  height?: number;
  duration?: number;
  bytes: number;
  created_at: string;
  tags: string[];
  version: number;
}

export async function uploadResource(
  file: Buffer,
  filename: string,
  folder: string = 'coseke'
) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto',
        public_id: filename.split('.')[0],
        eager: [
          { width: 200, height: 200, crop: 'fill', format: 'jpg' },
          { width: 400, height: 300, crop: 'fit', format: 'jpg' },
        ],
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    uploadStream.end(file);
  });
}

export async function deleteResource(publicId: string) {
  return cloudinary.uploader.destroy(publicId);
}

export async function listResources(folder: string = 'coseke', maxResults: number = 100) {
  return cloudinary.api.resources({
    type: 'upload',
    prefix: folder,
    max_results: maxResults,
    resource_type: 'image',
  });
}

export async function listVideoResources(folder: string = 'coseke', maxResults: number = 100) {
  return cloudinary.api.resources({
    type: 'upload',
    prefix: folder,
    max_results: maxResults,
    resource_type: 'video',
  });
}

export async function getResourceInfo(publicId: string) {
  return cloudinary.api.resource(publicId, { resource_type: 'image' });
}

export async function updateResourceTags(publicId: string, tags: string[]) {
  return cloudinary.uploader.add_tag(tags.join(','), [publicId]);
}
