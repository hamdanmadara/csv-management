import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true,
  },
  originalName: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  s3Key: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['uploading', 'completed', 'failed'],
    default: 'uploading',
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
  contentType: {
    type: String,
    required: true,
  },
  userId: {  // Add this field
    type: String,
    required: true,
  }
});

export const File = mongoose.models.File || mongoose.model('File', fileSchema);