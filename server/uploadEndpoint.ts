/**
 * File upload endpoint for S3 storage
 * Handles multipart/form-data file uploads
 */

import type { Request, Response } from 'express';
import { storagePut } from './storage';
import { nanoid } from 'nanoid';

export async function handleFileUpload(req: Request, res: Response) {
  try {
    // Check if file exists in request
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }
    
    const file = req.file;
    
    // Generate unique file key with random suffix to prevent enumeration
    const randomSuffix = nanoid(10);
    const fileExtension = file.originalname.split('.').pop();
    const fileKey = `appeal-documents/${Date.now()}-${randomSuffix}.${fileExtension}`;
    
    // Upload to S3
    const { url } = await storagePut(
      fileKey,
      file.buffer,
      file.mimetype
    );
    
    // Return S3 URL and key
    res.json({
      url,
      key: fileKey,
      fileName: file.originalname,
      fileSize: file.size,
      fileType: file.mimetype,
    });
  } catch (error: any) {
    console.error('[UploadEndpoint] Error uploading file:', error);
    res.status(500).json({ error: error.message || 'Upload failed' });
  }
}
