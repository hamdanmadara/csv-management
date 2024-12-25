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
  fileId?: string;
  abortController: AbortController;
}

const FileUploader = ({ onUploadComplete }: FileUploaderProps) => {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);

  const uploadFileInChunks = async (file: File, uploadingFile: UploadingFile) => {
    const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    let uploadedChunks = 0;

    try {
      // Initialize upload
      const initResponse = await axios.post('/api/upload/init', {
        filename: file.name,
        filesize: file.size
      });

      const fileId = initResponse.data.fileId;
      uploadingFile.fileId = fileId;

      // Upload chunks
      for (let partNumber = 1; partNumber <= totalChunks; partNumber++) {
        // Check if upload has been cancelled
        if (uploadingFile.abortController.signal.aborted) {
          throw new axios.Cancel('Upload cancelled');
        }

        const start = (partNumber - 1) * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        const formData = new FormData();
        formData.append('chunk', chunk);
        formData.append('partNumber', partNumber.toString());
        formData.append('totalChunks', totalChunks.toString());

        await axios.post(`/api/upload/${fileId}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          signal: uploadingFile.abortController.signal,
        });

        uploadedChunks++;
        const progress = Math.round((uploadedChunks / totalChunks) * 100);
        
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.file === file
              ? {
                  ...f,
                  progress: { progress, status: 'uploading' },
                  fileId
                }
              : f
          )
        );
      }

      // Upload completed successfully
      setUploadingFiles((prev) =>
        prev.map((f) =>
          f.file === file
            ? { 
                ...f, 
                progress: { progress: 100, status: 'completed' },
                fileId
              }
            : f
        )
      );
      
      toast.success(`${file.name} uploaded successfully`);
      onUploadComplete();

    } catch (error) {
      if (axios.isCancel(error)) {
        // Handle cancelled upload
        try {
          if (uploadingFile.fileId) {
            await axios.delete(`/api/files/${uploadingFile.fileId}`);
          }
        } catch (cleanupError) {
          console.error('Cleanup error:', cleanupError);
        }
        
        setUploadingFiles((prev) =>
          prev.filter((f) => f.file !== file)
        );
        toast.success(`Upload cancelled for ${file.name}`);
      } else {
        // Handle other errors
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
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map((file) => ({
      file,
      progress: { progress: 0, status: 'uploading' as const },
      abortController: new AbortController()
    }));

    setUploadingFiles((prev) => [...prev, ...newFiles]);

    // Upload files sequentially
    for (const uploadingFile of newFiles) {
      await uploadFileInChunks(uploadingFile.file, uploadingFile);
    }
  }, [onUploadComplete]);

  const removeFile = async (uploadingFile: UploadingFile) => {
    try {
      if (uploadingFile.progress.status === 'uploading') {
        // Cancel ongoing upload
        uploadingFile.abortController.abort();
        
        if (uploadingFile.fileId) {
          try {
            await axios.delete(`/api/files/${uploadingFile.fileId}`);
          } catch (cleanupError) {
            console.error('Cleanup error:', cleanupError);
          }
        }
        
        setUploadingFiles((prev) =>
          prev.filter((f) => f.file !== uploadingFile.file)
        );
        toast.success(`Cancelled upload: ${uploadingFile.file.name}`);
        return;
      }
  
      // Handle completed or failed uploads
      if (uploadingFile.fileId) {
        await axios.delete(`/api/files/${uploadingFile.fileId}`);
        toast.success(`${uploadingFile.file.name} deleted successfully`);
      }
  
      setUploadingFiles((prev) =>
        prev.filter((f) => f.file !== uploadingFile.file)
      );
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error(`Failed to delete ${uploadingFile.file.name}`);
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
    <div data-testid="file-list" className="space-y-4">
      <div
        {...getRootProps()}
        data-testid="upload-area"
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

      {uploadingFiles.map((uploadingFile) => (
        <div
          key={uploadingFile.file.name}
          className="bg-white rounded-lg p-4 shadow-sm border"
        >
          <div className="flex justify-between items-center mb-2">
            <div className="flex flex-col flex-grow mr-4">
              <span className="text-sm font-medium text-gray-900 truncate">
                {uploadingFile.file.name}
              </span>
              <span data-testid="file-status" className="text-xs text-gray-500">
                {uploadingFile.progress.status === 'uploading' && 'Uploading...'}
                {uploadingFile.progress.status === 'completed' && 'Upload complete'}
                {uploadingFile.progress.status === 'failed' && 'Upload failed'}
              </span>
            </div>
            <Button
              data-testid="delete-button"
              onClick={() => removeFile(uploadingFile)}
              variant="outline"
              size="sm"
              className="p-1 flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <Progress data-testid="progress-bar"  {...uploadingFile.progress} />
          {uploadingFile.progress.status === 'failed' && (
            <p data-testid="error-message" className="mt-1 text-sm text-red-600">
              Upload failed. Click X to remove and try again.
            </p>
          )}
        </div>
      ))}
    </div>
  );
};

export default FileUploader;