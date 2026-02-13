/**
 * Appeal Document Upload Component
 * Handles file upload to S3 and document management
 */

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, File, FileText, Image, X, Download, Loader2, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

interface AppealDocumentUploadProps {
  appealId: number;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

function getFileIcon(fileType: string) {
  if (fileType.startsWith("image/")) {
    return <Image className="w-4 h-4" />;
  } else if (fileType === "application/pdf") {
    return <FileText className="w-4 h-4" />;
  } else {
    return <File className="w-4 h-4" />;
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
}

export function AppealDocumentUpload({ appealId }: AppealDocumentUploadProps) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const { data: documents = [], refetch } = trpc.appeals.getDocuments.useQuery({ appealId });
  const uploadDocumentMutation = trpc.appeals.uploadDocument.useMutation();
  const deleteDocumentMutation = trpc.appeals.deleteDocument.useMutation();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const uploadToS3 = async (file: File): Promise<{ fileKey: string; fileUrl: string }> => {
    // Generate unique file key
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(7);
    const fileKey = `appeals/${appealId}/documents/${timestamp}-${randomSuffix}-${file.name}`;

    // In a real implementation, you would:
    // 1. Call a backend endpoint to get a presigned URL
    // 2. Upload directly to S3 using the presigned URL
    // 3. Return the file key and public URL

    // For now, we'll simulate the upload
    // TODO: Implement actual S3 upload using storagePut from server
    const formData = new FormData();
    formData.append("file", file);
    formData.append("fileKey", fileKey);

    // Call backend to handle S3 upload
    const response = await fetch("/api/upload-document", {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to upload file to S3");
    }

    const data = await response.json();
    return {
      fileKey: data.fileKey,
      fileUrl: data.fileUrl,
    };
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (!user) {
      toast.error("You must be logged in to upload documents");
      return;
    }

    const file = files[0];

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File size exceeds ${formatFileSize(MAX_FILE_SIZE)} limit`);
      return;
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast.error("File type not supported. Please upload PDF, images, or Office documents.");
      return;
    }

    setUploading(true);

    try {
      // Upload to S3
      const { fileKey, fileUrl } = await uploadToS3(file);

      // Save document metadata to database
      await uploadDocumentMutation.mutateAsync({
        appealId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        fileKey,
        fileUrl,
        uploadedBy: user.id,
      });

      toast.success("Document uploaded successfully");
      refetch();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to upload document");
    } finally {
      setUploading(false);
      setDragActive(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  }, [appealId, user]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const handleDelete = async (documentId: number) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      await deleteDocumentMutation.mutateAsync({ documentId });
      toast.success("Document deleted successfully");
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete document");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Supporting Documents
        </CardTitle>
        <CardDescription>
          Upload photos, appraisals, correspondence, and other supporting materials
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive ? "border-primary bg-primary/5" : "border-border"
          } ${uploading ? "opacity-50 pointer-events-none" : ""}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Uploading...</p>
            </div>
          ) : (
            <>
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <label htmlFor="document-upload" className="cursor-pointer">
                <div className="text-sm text-muted-foreground mb-2">
                  Click to upload or drag and drop
                </div>
                <div className="text-xs text-muted-foreground">
                  PDF, Images, Word, Excel (max {formatFileSize(MAX_FILE_SIZE)})
                </div>
              </label>
              <input
                id="document-upload"
                type="file"
                accept={ALLOWED_FILE_TYPES.join(",")}
                onChange={handleFileInput}
                className="hidden"
              />
            </>
          )}
        </div>

        {/* Document List */}
        {documents.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Uploaded Documents ({documents.length})</h4>
            <div className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {getFileIcon(doc.fileType)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{doc.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(doc.fileSize)} • {new Date(doc.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(doc.fileUrl, "_blank")}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(doc.id)}
                      disabled={deleteDocumentMutation.isPending}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {documents.length === 0 && !uploading && (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No documents uploaded yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
