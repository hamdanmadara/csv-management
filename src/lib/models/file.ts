// src/lib/models/files.ts

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
  userId: {
    type: String,
    required: true,
  },
  uploadId: {
    type: String,
    default: null
  },
  parts: [{
    ETag: String,
    PartNumber: Number
  }],
});

export const File = mongoose.models.File || mongoose.model('File', fileSchema);