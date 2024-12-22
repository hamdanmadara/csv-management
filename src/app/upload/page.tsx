'use client';

import FileUploader from '@/components/FileUploader';
import { useRouter } from 'next/navigation';

export default function UploadPage() {
  const router = useRouter();

  const handleUploadComplete = () => {
    // Refresh the file list when upload is complete
    router.refresh();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Upload CSV Files</h1>
        <p className="mt-2 text-gray-600">
          Select or drag and drop your CSV files here. You can upload multiple
          files at once.
        </p>
      </div>
      <FileUploader onUploadComplete={handleUploadComplete} />
    </div>
  );
}