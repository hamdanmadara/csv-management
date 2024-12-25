import { useEffect, useState } from 'react';
import axios from 'axios';
import { FileDocument } from '@/types';
import FileCard from './FileCard';

const FileList = () => {
  const [files, setFiles] = useState<FileDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get<FileDocument[]>('/api/files');
      setFiles(data);
      setError(null);
    } catch (err) {
      setError('Failed to load files');
      console.error('Error fetching files:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handlePreview = async (file: FileDocument) => {
    try {
      const { data } = await axios.get(`/api/files/${file._id}`);
      // Open the preview URL in a new tab
      window.open(data.previewUrl, '_blank');
    } catch (err) {
      console.error('Error previewing file:', err);
    }
  };

  const handleDownload = async (file: FileDocument) => {
    try {
      const { data } = await axios.get(`/api/files/${file._id}`);
      // Create a temporary link and click it to trigger download
      const link = document.createElement('a');
      link.href = data.downloadUrl;
      link.download = file.originalName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error downloading file:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 py-8">
        <p>{error}</p>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <p>No files uploaded yet</p>
      </div>
    );
  }

    return (
        <div className="grid grid-cols-1 gap-4 w-full">
        {files.map((file) => (
            <FileCard
            key={file._id}
            file={file}
            onPreview={handlePreview}
            onDownload={handleDownload}
            />
        ))}
        </div>
    );
};

export default FileList;