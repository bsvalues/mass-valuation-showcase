import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, CheckCircle2, XCircle, Clock, Loader2, AlertCircle } from 'lucide-react';
// Removed direct server import - using tRPC API instead
import { toast } from 'sonner';

export default function DataImport() {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentJobId, setCurrentJobId] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const uploadFileMutation = trpc.dataImport.uploadFile.useMutation();
  const uploadToS3Mutation = trpc.dataImport.uploadToS3.useMutation();
  const processFileMutation = trpc.dataImport.processFile.useMutation();
  const { data: jobs, refetch: refetchJobs } = trpc.dataImport.listJobs.useQuery({ page: 1, pageSize: 10 });
  const { data: currentJob } = trpc.dataImport.getJobStatus.useQuery(
    { jobId: currentJobId! },
    { enabled: !!currentJobId, refetchInterval: 2000 }
  );
  
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      setIsUploading(true);
      setUploadProgress(0);
      
      try {
        // Step 1: Create import job and get upload credentials
        const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'unknown';
        const { jobId, fileKey } = await uploadFileMutation.mutateAsync({
          filename: file.name,
          fileFormat: fileExtension,
        });
        
        setUploadProgress(30);
        
        // Step 2: Upload file to S3 via tRPC
        const fileBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(fileBuffer);
        const base64Data = btoa(Array.from(uint8Array).map(b => String.fromCharCode(b)).join(''));
        const { url: fileUrl } = await uploadToS3Mutation.mutateAsync({
          fileKey,
          fileData: base64Data,
          contentType: file.type,
        });
        
        setUploadProgress(70);
        
        // Step 3: Trigger processing
        await processFileMutation.mutateAsync({ 
          jobId, 
          fileUrl,
        });
        
        setUploadProgress(100);
        setCurrentJobId(jobId);
        
        toast.success(`File "${file.name}" uploaded successfully. Processing started.`);
        
        // Refresh job list
        refetchJobs();
        
      } catch (error) {
        console.error('Upload failed:', error);
        toast.error(`Failed to upload "${file.name}": ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsUploading(false);
        setTimeout(() => setUploadProgress(0), 2000);
      }
    }
  }, [uploadFileMutation, processFileMutation, refetchJobs]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/xml': ['.xml'],
      'application/xml': ['.xml'],
      'application/pdf': ['.pdf'],
      'application/json': ['.json'],
    },
    disabled: isUploading,
  });
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-600 hover:bg-green-700">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'partial':
        return <Badge className="bg-amber-600 hover:bg-amber-700">Partial</Badge>;
      case 'processing':
        return <Badge className="bg-blue-600 hover:bg-blue-700">Processing</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'partial':
        return <AlertCircle className="w-5 h-5 text-amber-600" />;
      case 'processing':
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-muted-foreground" />;
    }
  };
  
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2 text-[#00FFEE]">Universal Data Ingestion</h1>
        <p className="text-muted-foreground">
          Upload property assessment data from CSV, Excel, XML, PDF, or JSON files
        </p>
      </div>
      
      {/* Upload Zone */}
      <Card className="border-[#00D9D9]/20 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-[#00FFEE]">Upload Files</CardTitle>
          <CardDescription>
            Drag and drop files or click to browse. Supports CSV, XLSX, XLS, XML, PDF, and JSON.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all ${
              isDragActive 
                ? 'border-[#00FFEE] bg-[#00FFEE]/5 shadow-[0_0_20px_rgba(0,255,238,0.2)]' 
                : isUploading
                ? 'border-muted-foreground/25 opacity-50 cursor-not-allowed'
                : 'border-[#00D9D9]/30 hover:border-[#00FFEE]/50 hover:bg-[#00FFEE]/5'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 mx-auto mb-4 text-[#00FFEE]" />
            {isDragActive ? (
              <p className="text-lg font-medium text-[#00FFEE]">Drop files here...</p>
            ) : isUploading ? (
              <p className="text-lg font-medium text-muted-foreground">Uploading...</p>
            ) : (
              <>
                <p className="text-lg font-medium mb-2">Drag & drop files here</p>
                <p className="text-sm text-muted-foreground">or click to select files</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Supported formats: CSV, XLSX, XLS, XML, PDF, JSON
                </p>
              </>
            )}
          </div>
          
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="mt-4">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-sm text-muted-foreground mt-2">Uploading... {uploadProgress}%</p>
            </div>
          )}
          
          {currentJob && (
            <div className="mt-4 p-4 border border-[#00D9D9]/20 rounded-lg bg-card/30 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{currentJob.filename}</span>
                {getStatusBadge(currentJob.status)}
              </div>
              {currentJob.status === 'processing' && (currentJob.totalRecords || 0) > 0 && (
                <Progress 
                  value={((currentJob.successfulRecords || 0) / (currentJob.totalRecords || 1)) * 100} 
                  className="h-2 mb-2"
                />
              )}
              {currentJob.status !== 'pending' && (currentJob.totalRecords || 0) > 0 && (
                <div className="text-sm text-muted-foreground">
                  {currentJob.successfulRecords || 0} of {currentJob.totalRecords || 0} records imported successfully
                  {(currentJob.failedRecords || 0) > 0 && (
                    <span className="text-amber-600 ml-1">
                      ({currentJob.failedRecords || 0} failed)
                    </span>
                  )}
                </div>
              )}
              {currentJob.errorSummary && (
                <p className="text-sm text-red-600 mt-2">{currentJob.errorSummary}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Import History */}
      <Card className="border-[#00D9D9]/20 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-[#00FFEE]">Import History</CardTitle>
          <CardDescription>Recent file uploads and processing status</CardDescription>
        </CardHeader>
        <CardContent>
          {!jobs || jobs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">No import history yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Upload your first file to get started
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <div 
                  key={job.id} 
                  className="flex items-center justify-between p-4 border border-[#00D9D9]/20 rounded-lg bg-card/30 backdrop-blur-sm hover:border-[#00FFEE]/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {getStatusIcon(job.status)}
                    <div>
                      <p className="font-medium">{job.filename}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(job.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {job.status === 'completed' && (
                      <div className="text-right">
                        <p className="text-sm font-medium text-green-600">
                          {job.successfulRecords} records imported
                        </p>
                      </div>
                    )}
                    {job.status === 'failed' && (
                      <div className="text-right">
                        <p className="text-sm font-medium text-red-600">Import failed</p>
                        {job.errorSummary && (
                          <p className="text-xs text-muted-foreground">{job.errorSummary}</p>
                        )}
                      </div>
                    )}
                    {job.status === 'processing' && (
                      <div className="text-right">
                        <p className="text-sm font-medium text-blue-600">Processing...</p>
                        {(job.totalRecords || 0) > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {job.successfulRecords || 0}/{job.totalRecords || 0} records
                          </p>
                        )}
                      </div>
                    )}
                    {job.status === 'partial' && (
                      <div className="text-right">
                        <p className="text-sm font-medium text-amber-600">
                          {job.successfulRecords || 0}/{job.totalRecords || 0} imported
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {job.failedRecords || 0} records failed
                        </p>
                      </div>
                    )}
                    {getStatusBadge(job.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
