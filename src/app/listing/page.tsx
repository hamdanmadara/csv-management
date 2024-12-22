'use client';

import FileList from '@/components/FileList';

export default function ListingPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Uploaded Files</h1>
        <p className="mt-2 text-gray-600">
          View and manage all your uploaded CSV files. You can preview or download
          any file from this list.
        </p>
      </div>
      <FileList />
    </div>
  );
}