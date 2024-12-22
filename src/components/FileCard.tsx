import { FileDocument } from '@/types';
import { FileText, Download, Eye } from 'lucide-react';
import Button from './ui/Button';

interface FileCardProps {
  file: FileDocument;
  onPreview: (file: FileDocument) => void;
  onDownload: (file: FileDocument) => void;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const FileCard = ({ file, onPreview, onDownload }: FileCardProps) => {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
      <div className="flex flex-col sm:flex-row items-start gap-4">
        {/* File Icon */}
        <div className="p-2 bg-blue-100 rounded-lg shrink-0">
          <FileText className="h-8 w-8 text-blue-600" />
        </div>

        {/* File Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {file.originalName}
          </h3>
          <div className="mt-1 text-sm text-gray-500 space-y-1">
            <p>Size: {formatFileSize(file.size)}</p>
            <p>Uploaded: {formatDate(file.uploadedAt)}</p>
            <p className="capitalize">Status: {file.status}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto">
          <Button
            onClick={() => onPreview(file)}
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-none justify-center"
          >
            <Eye className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Preview</span>
          </Button>
          <Button
            onClick={() => onDownload(file)}
            variant="primary"
            size="sm"
            className="flex-1 sm:flex-none justify-center"
          >
            <Download className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Download</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FileCard;