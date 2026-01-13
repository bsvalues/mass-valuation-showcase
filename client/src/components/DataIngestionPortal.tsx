import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Database, FileSpreadsheet, Upload, X } from "lucide-react";
import Papa from "papaparse";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";

interface DataIngestionPortalProps {
  onDataLoaded: (data: any[]) => void;
}

export function DataIngestionPortal({ onDataLoaded }: DataIngestionPortalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [uploadState, setUploadState] = useState<'idle' | 'parsing' | 'complete' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [recordCount, setRecordCount] = useState(0);
  const [fileName, setFileName] = useState("");

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setFileName(file.name);
    setUploadState('parsing');
    setProgress(10);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setProgress(100);
        setRecordCount(results.data.length);
        setUploadState('complete');
        onDataLoaded(results.data);
        toast.success("Data Ingestion Complete", {
          description: `Successfully parsed ${results.data.length.toLocaleString()} records from ${file.name}`
        });
      },
      error: (error) => {
        setUploadState('error');
        toast.error("Parsing Error", {
          description: error.message
        });
      }
    });
  }, [onDataLoaded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv']
    },
    maxFiles: 1
  });

  const resetUpload = (e: React.MouseEvent) => {
    e.stopPropagation();
    setUploadState('idle');
    setProgress(0);
    setRecordCount(0);
    setFileName("");
  };

  return (
    <>
      <Button 
        variant="ghost" 
        size="icon" 
        className="rounded-full w-10 h-10 bg-primary/10 hover:bg-primary/20 text-primary active-recoil"
        onClick={() => setIsOpen(true)}
        title="Data Ingestion Portal"
      >
        <Database className="w-5 h-5" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-xl bg-[#0b1020]/95 border border-[#00ffee]/30 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-[#00ffee] flex items-center gap-2">
              <Database className="w-5 h-5" />
              The Uplink: Data Ingestion
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Upload county tax rolls (CSV) to hydrate the Quantum Core with real-world data.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div 
              {...getRootProps()} 
              className={cn(
                "border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-300",
                isDragActive ? "border-[#00ffee] bg-[#00ffee]/10" : "border-white/10 hover:border-[#00ffee]/50 hover:bg-white/5",
                uploadState === 'complete' && "border-green-500/50 bg-green-500/5"
              )}
            >
              <input {...getInputProps()} />
              
              {uploadState === 'idle' && (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                    <Upload className="w-8 h-8 text-slate-400" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-lg font-medium text-white">Drop CSV file here</p>
                    <p className="text-sm text-slate-400">or click to browse filesystem</p>
                  </div>
                </div>
              )}

              {uploadState === 'parsing' && (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-[#00ffee]/10 flex items-center justify-center animate-pulse">
                    <FileSpreadsheet className="w-8 h-8 text-[#00ffee]" />
                  </div>
                  <div className="space-y-2 w-full max-w-xs">
                    <p className="text-lg font-medium text-[#00ffee]">Parsing Data Structure...</p>
                    <Progress value={progress} className="h-2 bg-white/10 [&>div]:bg-[#00ffee]" />
                  </div>
                </div>
              )}

              {uploadState === 'complete' && (
                <div className="flex flex-col items-center gap-4 relative">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute -top-6 -right-6 text-slate-500 hover:text-white"
                    onClick={resetUpload}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-lg font-medium text-green-400">Ingestion Successful</p>
                    <p className="text-sm text-slate-400">{fileName}</p>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 mt-2">
                      <Database className="w-3 h-3 text-green-400" />
                      <span className="text-xs font-mono text-green-400">{recordCount.toLocaleString()} Records</span>
                    </div>
                  </div>
                </div>
              )}

              {uploadState === 'error' && (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-lg font-medium text-red-400">Ingestion Failed</p>
                    <Button variant="link" onClick={resetUpload} className="text-red-400 underline">Try Again</Button>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-black/30 p-4 rounded-lg border border-white/5">
              <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Required Schema</h4>
              <div className="grid grid-cols-3 gap-2 text-xs font-mono text-slate-500">
                <div className="bg-white/5 p-2 rounded">PIN / Parcel ID</div>
                <div className="bg-white/5 p-2 rounded">Address</div>
                <div className="bg-white/5 p-2 rounded">Owner Name</div>
                <div className="bg-white/5 p-2 rounded">Land Value</div>
                <div className="bg-white/5 p-2 rounded">Improvement Value</div>
                <div className="bg-white/5 p-2 rounded">Total Value</div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
