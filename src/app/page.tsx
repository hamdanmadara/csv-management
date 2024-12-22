import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] bg-gradient-to-b from-blue-50 to-white px-4">
      <div className="text-center max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
          CSV File Management System
        </h1>
        <p className="mt-6 text-lg leading-8 text-gray-600">
          Upload, manage, and analyze your CSV files with ease. Our system provides
          a seamless experience for handling your data files with features like
          progress tracking, file preview, and secure storage.
        </p>
        <div className="mt-10">
          <Link
            href="/upload"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Get Started
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Easy Upload</h3>
            <p className="mt-2 text-gray-600">
              Drag and drop multiple CSV files or browse to select them from your
              computer.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Track Progress</h3>
            <p className="mt-2 text-gray-600">
              Monitor upload progress in real-time with our intuitive progress
              tracking system.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">
              Secure Storage
            </h3>
            <p className="mt-2 text-gray-600">
              Your files are securely stored in AWS S3 with proper access controls
              and encryption.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}