'use client';

import { useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface MediaUploaderProps {
  onUploadSuccess: () => void;
  folder?: string;
}

export function MediaUploader({ onUploadSuccess, folder = 'coseke' }: MediaUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleUpload = async (files: FileList | null) => {
    if (!files) return;

    setIsUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', folder);

        const response = await fetch('/api/media/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        const data = await response.json();
        toast.success(`${file.name} uploaded successfully`);
      }

      onUploadSuccess();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload failed';
      toast.error(message);
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files) {
      handleUpload(e.dataTransfer.files);
    }
  };

  return (
    <div
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        dragActive
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
      }`}
    >
      <input
        type="file"
        id="file-upload"
        multiple
        accept="image/*,video/*"
        onChange={(e) => handleUpload(e.target.files)}
        disabled={isUploading}
        className="hidden"
      />

      <label
        htmlFor="file-upload"
        className="flex flex-col items-center justify-center cursor-pointer"
      >
        <div className="mb-4">
          {isUploading ? (
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto" />
          ) : (
            <Upload className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto" />
          )}
        </div>

        <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {isUploading ? 'Uploading...' : 'Drop files or click to upload'}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Supported: Images (JPG, PNG, GIF, WebP) and Videos (MP4, WebM, MOV)
        </p>
      </label>
    </div>
  );
}
