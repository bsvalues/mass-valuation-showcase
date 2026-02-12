import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Upload, Download, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface AppealDocumentsProps {
  appealId: number;
}

export function AppealDocuments({ appealId }: AppealDocumentsProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { data: documents, isLoading, refetch } = trpc.appeals.getDocuments.useQuery({ appealId });
  const uploadDocument = trpc.appeals.uploadDocument.useMutation({
    onSuccess: () => {
      toast.success("Document uploaded successfully");
      refetch();
    },
    onError: (error: any) => {
      toast.error(`Failed to upload document: ${error.message}`);
    },
  });
  
  const deleteDocument = trpc.appeals.deleteDocument.useMutation({
    onSuccess: () => {
      toast.success("Document deleted successfully");
      refetch();
    },
    onError: (error: any) => {
      toast.error(`Failed to delete document: ${error.message}`);
    },
  });

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }
    
    setUploading(true);
    
    try {
      // In a real implementation, this would:
      // 1. Upload file to S3 using storagePut()
      // 2. Get the S3 URL and key
      // 3. Call uploadDocument mutation with metadata
      
      // For now, show error since backend isn't fully implemented
      toast.error("Document upload requires database migration. Run pnpm db:push first.");
    } catch (error: any) {
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDownload = (fileUrl: string, fileName: string) => {
    // Open file in new tab for download
    window.open(fileUrl, "_blank");
  };

  const handlePreview = (fileUrl: string, fileType: string) => {
    // For images and PDFs, open in new tab for preview
    if (fileType.startsWith("image/") || fileType === "application/pdf") {
      window.open(fileUrl, "_blank");
    } else {
      toast.info("Preview not available for this file type");
    }
  };

  const handleDelete = (documentId: number, fileName: string) => {
    if (confirm(`Are you sure you want to delete "${fileName}"?`)) {
      deleteDocument.mutate({ documentId });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Supporting Documents
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Button */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full"
            variant="outline"
          >
            <Upload className="w-4 h-4 mr-2" />
            {uploading ? "Uploading..." : "Upload Document"}
          </Button>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Supported: PDF, Images, Word, Excel (Max 10MB)
          </p>
        </div>

        {/* Documents List */}
        <div className="space-y-3 mt-6">
          {isLoading && (
            <div className="text-center text-muted-foreground py-8">
              Loading documents...
            </div>
          )}
          
          {!isLoading && documents && documents.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              No documents uploaded yet. Upload the first document above.
            </div>
          )}
          
          {documents && documents.map((doc: any) => (
            <div
              key={doc.id}
              className="border rounded-lg p-4 space-y-2 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{doc.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(doc.fileSize)} • {formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handlePreview(doc.fileUrl, doc.fileType)}
                    title="Preview"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDownload(doc.fileUrl, doc.fileName)}
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(doc.id, doc.fileName)}
                    title="Delete"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
