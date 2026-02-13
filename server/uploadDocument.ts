/**
 * Document Upload Handler
 * Handles file uploads to S3 for appeal documents
 */

import { Request, Response } from "express";
import { storagePut } from "./storage";
import multer from "multer";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

export const uploadMiddleware = upload.single("file");

export async function handleDocumentUpload(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const fileKey = req.body.fileKey as string;
    if (!fileKey) {
      return res.status(400).json({ error: "File key is required" });
    }

    // Upload to S3
    const { url } = await storagePut(
      fileKey,
      req.file.buffer,
      req.file.mimetype
    );

    res.json({
      success: true,
      fileKey,
      fileUrl: url,
    });
  } catch (error) {
    console.error("[Upload] Document upload error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Upload failed",
    });
  }
}
