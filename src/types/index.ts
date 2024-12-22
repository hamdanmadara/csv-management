export interface FileDocument {
    _id: string;
    filename: string;
    originalName: string;
    size: number;
    s3Key: string;
    status: 'uploading' | 'completed' | 'failed';
    uploadedAt: Date;
    contentType: string;
  }
  
  export interface UploadProgress {
    progress: number;
    status: 'uploading' | 'completed' | 'failed';
  }
  
  export interface FileUploadResponse {
    fileId: string;
    uploadUrl: string;
  }