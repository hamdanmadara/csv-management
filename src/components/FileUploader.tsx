// src/component/FileUploader
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

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newFiles:any = acceptedFiles.map((file) => ({
      file,
      progress: { progress: 0, status: 'uploading' as const },
      abortController: new AbortController()
    }));

    setUploadingFiles((prev) => [...prev, ...newFiles]);

    for (const uploadingFile of newFiles) {
      try {
        const formData = new FormData();
        formData.append('file', uploadingFile.file);

        let uploadedFileId: string | undefined;

        // First request to initiate upload and get file ID
        const initResponse = await axios.post('/api/upload/init', {
          filename: uploadingFile.file.name,
          filesize: uploadingFile.file.size
        });

        uploadedFileId = initResponse.data.fileId;

        // Upload file with abort signal
        const response = await axios.post(`/api/upload/${uploadedFileId}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          signal: uploadingFile.abortController.signal,
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total!
            );
            setUploadingFiles((prev) =>
              prev.map((f) =>
                f.file === uploadingFile.file
                  ? {
                      ...f,
                      progress: { progress: percentCompleted, status: 'uploading' },
                      fileId: uploadedFileId
                    }
                  : f
              )
            );
          },
        });

        if (response.data.success) {
          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.file === uploadingFile.file
                ? { 
                    ...f, 
                    progress: { progress: 100, status: 'completed' },
                    fileId: uploadedFileId
                  }
                : f
            )
          );
          toast.success(`${uploadingFile.file.name} uploaded successfully`);
          onUploadComplete();
        }
      } catch (error) {
        if (axios.isCancel(error)) {
          // If cancelled, attempt to clean up
          try {
            if (uploadingFile.fileId) {
              await axios.delete(`/api/files/${uploadingFile.fileId}`);
            }
          } catch (cleanupError) {
            console.error('Cleanup error:', cleanupError);
          }
          
          setUploadingFiles((prev) =>
            prev.filter((f) => f.file !== uploadingFile.file)
          );
          toast.success(`Upload cancelled for ${uploadingFile.file.name}`);
        } else {
          console.error('Upload failed:', error);
          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.file === uploadingFile.file
                ? { ...f, progress: { progress: 0, status: 'failed' } }
                : f
            )
          );
          toast.error(`Failed to upload ${uploadingFile.file.name}`);
        }
      }
    }
  }, [onUploadComplete]);

  const removeFile = async (uploadingFile: UploadingFile) => {
    try {
      if (uploadingFile.progress.status === 'uploading') {
        // First abort the upload
        uploadingFile.abortController.abort();
        
        // Then attempt to clean up on the server
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
              <span className="text-xs text-gray-500">
                {uploadingFile.progress.status === 'uploading' && 'Uploading...'}
                {uploadingFile.progress.status === 'completed' && 'Upload complete'}
                {uploadingFile.progress.status === 'failed' && 'Upload failed'}
              </span>
            </div>
            <Button
              onClick={() => removeFile(uploadingFile)}
              variant="outline"
              size="sm"
              className="p-1 flex-shrink-0"
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
  );
};

export default FileUploader;