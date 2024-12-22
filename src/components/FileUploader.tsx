'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X } from 'lucide-react';
import axios from 'axios';
import Progress from './ui/Progress';
import Button from './ui/Button';
import { UploadProgress } from '@/types';
import toast from 'react-hot-toast';

interface FileUploaderProps {
  onUploadComplete: () => void;
}

interface UploadingFile {
  file: File;
  progress: UploadProgress;
  fileId?: string; // Added fileId to track uploaded files
}

const FileUploader = ({ onUploadComplete }: FileUploaderProps) => {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map((file) => ({
      file,
      progress: { progress: 0, status: 'uploading' as const },
    }));

    setUploadingFiles((prev) => [...prev, ...newFiles]);

    for (const { file } of newFiles) {
      try {
        // Create FormData
        const formData = new FormData();
        formData.append('file', file);

        // Upload file
        const response = await axios.post('/api/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total!
            );
            setUploadingFiles((prev) =>
              prev.map((f) =>
                f.file === file
                  ? {
                      ...f,
                      progress: { progress: percentCompleted, status: 'uploading' },
                    }
                  : f
              )
            );
          },
        });

        if (response.data.success) {
          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.file === file
                ? { 
                    ...f, 
                    progress: { progress: 100, status: 'completed' },
                    fileId: response.data.fileId // Store the file ID from response
                  }
                : f
            )
          );
          toast.success(`${file.name} uploaded successfully`);
          onUploadComplete();
        }
      } catch (error) {
        console.error('Upload failed:', error);
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.file === file
              ? { ...f, progress: { progress: 0, status: 'failed' } }
              : f
          )
        );
        toast.error(`Failed to upload ${file.name}`);
      }
    }
  }, [onUploadComplete]);

  const removeFile = async (uploadingFile: UploadingFile) => {
    try {
      // If file was successfully uploaded (has fileId), delete it from server
      if (uploadingFile.fileId) {
        await axios.delete(`/api/files/${uploadingFile.fileId}`);
        toast.success(`${uploadingFile.file.name} deleted successfully`);
      }
      
      // Remove from UI regardless of server deletion
      setUploadingFiles((prev) =>
        prev.filter((f) => f.file !== uploadingFile.file)
      );
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error(`Failed to delete ${uploadingFile.file.name}`);
      
      // If deletion fails, mark the file as failed
      setUploadingFiles((prev) =>
        prev.map((f) =>
          f.file === uploadingFile.file
            ? { ...f, progress: { progress: 0, status: 'failed' } }
            : f
        )
      );
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
    multiple: true,
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${
            isDragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          Drag & drop CSV files here, or click to select files
        </p>
      </div>

      {uploadingFiles.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Uploading Files</h3>
          <div className="space-y-2">
            {uploadingFiles.map((uploadingFile) => (
              <div
                key={uploadingFile.file.name}
                className="bg-white rounded-lg p-4 shadow-sm border"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-900 truncate max-w-[calc(100%-3rem)]">
                    {uploadingFile.file.name}
                  </span>
                  <Button
                    onClick={() => removeFile(uploadingFile)}
                    variant="outline"
                    size="sm"
                    className="p-1 ml-2 flex-shrink-0"
                    disabled={uploadingFile.progress.progress > 0 && uploadingFile.progress.progress < 100}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Progress {...uploadingFile.progress} />
                {uploadingFile.progress.status === 'failed' && (
                  <p className="mt-1 text-sm text-red-600">
                    Upload failed. Click X to remove and try again.
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploader;