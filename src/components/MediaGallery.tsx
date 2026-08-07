'use client';

import { useState, useEffect } from 'react';
import { Loader2, Trash2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

interface MediaItem {
  public_id: string;
  url: string;
  secure_url: string;
  resource_type: 'image' | 'video' | 'raw';
  format: string;
  width?: number;
  height?: number;
  duration?: number;
  bytes: number;
  created_at: string;
}

interface MediaGalleryProps {
  folder?: string;
  resourceType?: 'image' | 'video' | 'all';
  refreshTrigger?: number;
}

export function MediaGallery({ 
  folder = 'coseke', 
  resourceType = 'all',
  refreshTrigger = 0 
}: MediaGalleryProps) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    loadMedia();
  }, [refreshTrigger, folder, resourceType]);

  const loadMedia = async () => {
    setIsLoading(true);
    try {
      const type = resourceType === 'all' ? 'image' : resourceType;
      const response = await fetch(
        `/api/media/list?folder=${folder}&type=${type}&maxResults=100`
      );

      if (!response.ok) {
        throw new Error('Failed to load images');
      }

      const data = await response.json();
      setMedia(data.resources || []);
    } catch (error) {
      console.error('Error loading images:', error);
      toast.error('Failed to load images');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (publicId: string) => {
    if (!confirm('Are you sure you want to delete this images?')) {
      return;
    }

    try {
      const response = await fetch('/api/media/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicId, resourceType: 'image' }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete images');
      }

      setMedia(media.filter((item) => item.public_id !== publicId));
      toast.success('Media deleted successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete images';
      toast.error(message);
    }
  };

  const copyToClipboard = (url: string, publicId: string) => {
    navigator.clipboard.writeText(url);
    setCopied(publicId);
    toast.success('URL copied to clipboard');
    setTimeout(() => setCopied(null), 2000);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500 dark:text-gray-400" />
      </div>
    );
  }

  if (media.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">No media found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {media.map((item) => (
        <div
          key={item.public_id}
          className="bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
        >
          <div className="relative bg-gray-900 h-40">
            {item.resource_type === 'image' ? (
              <Image
                src={item.secure_url}
                alt={item.public_id}
                fill
                className="object-cover"
              />
            ) : (
              <video
                src={item.secure_url}
                className="w-full h-full object-cover"
              />
            )}
          </div>

          <div className="p-4">
            <p className="text-sm font-mono text-gray-700 dark:text-gray-300 truncate mb-2">
              {item.public_id}
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400 mb-3">
              <div>
                <span className="font-semibold">Type:</span> {item.format.toUpperCase()}
              </div>
              <div>
                <span className="font-semibold">Size:</span> {formatFileSize(item.bytes)}
              </div>
              {item.width && (
                <div>
                  <span className="font-semibold">Dimensions:</span> {item.width}x
                  {item.height}
                </div>
              )}
              <div>
                <span className="font-semibold">Uploaded:</span>{' '}
                {formatDate(item.created_at)}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => copyToClipboard(item.secure_url, item.public_id)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm font-medium transition-colors"
              >
                {copied === item.public_id ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy URL
                  </>
                )}
              </button>

              <button
                onClick={() => handleDelete(item.public_id)}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded text-sm font-medium transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
