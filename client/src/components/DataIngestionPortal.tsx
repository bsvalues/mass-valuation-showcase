import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Database, FileSpreadsheet, Upload, X, ArrowRightLeft, Download } from "lucide-react";
import Papa from "papaparse";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface DataIngestionPortalProps {
  onDataLoaded: (data: any[]) => void;
}

const REQUIRED_FIELDS = [
  { key: 'pin', label: 'PIN / Parcel ID' },
  { key: 'address', label: 'Address' },
  { key: 'owner', label: 'Owner Name' },
  { key: 'land_value', label: 'Land Value' },
  { key: 'imp_value', label: 'Improvement Value' },
  { key: 'total_value', label: 'Total Value' }
];

export function DataIngestionPortal({ onDataLoaded }: DataIngestionPortalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [uploadState, setUploadState] = useState<'idle' | 'parsing' | 'mapping' | 'complete' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [recordCount, setRecordCount] = useState(0);
  const [fileName, setFileName] = useState("");
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [rawResults, setRawResults] = useState<any[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});

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
        if (results.meta.fields) {
          setCsvHeaders(results.meta.fields);
          setRawResults(results.data);
          setRecordCount(results.data.length);
          setUploadState('mapping');
          
          // Auto-map fields if names match closely
          const initialMapping: Record<string, string> = {};
          REQUIRED_FIELDS.forEach(field => {
            const match = results.meta.fields?.find(h => 
              h.toLowerCase().includes(field.key.split('_')[0]) || 
              h.toLowerCase() === field.key
            );
            if (match) initialMapping[field.key] = match;
          });
          setColumnMapping(initialMapping);
        }
      },
      error: (error) => {
        setUploadState('error');
        toast.error("Parsing Error", {
          description: error.message
        });
      }
    });
  }, []);

  const handleMappingComplete = () => {
    const mappedData = rawResults.map(row => {
      const newRow: any = {};
      Object.entries(columnMapping).forEach(([systemKey, csvHeader]) => {
        newRow[systemKey] = row[csvHeader];
      });
      return newRow;
    });

    onDataLoaded(mappedData);
    setUploadState('complete');
    toast.success("Data Ingestion Complete", {
      description: `Successfully mapped and loaded ${mappedData.length.toLocaleString()} records.`
    });
  };

  const handleExport = () => {
    if (rawResults.length === 0) {
      toast.error("No data to export");
      return;
    }

    const csv = Papa.unparse(rawResults);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Data Exported", {
      description: "Dataset downloaded successfully."
    });
  };

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
      <div className="flex gap-2">
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full w-10 h-10 bg-primary/10 hover:bg-primary/20 text-primary active-recoil"
          onClick={() => setIsOpen(true)}
          title="Data Ingestion Portal"
        >
          <Database className="w-5 h-5" />
        </Button>
        
        {recordCount > 0 && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full w-10 h-10 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 active-recoil"
            onClick={handleExport}
            title="Export Dataset"
          >
            <Download className="w-5 h-5" />
          </Button>
        )}
      </div>

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

              {uploadState === 'mapping' && (
                <div className="w-full space-y-4 text-left">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-white">Map CSV Columns</h3>
                    <span className="text-xs text-slate-400">{fileName}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-2">
                    {REQUIRED_FIELDS.map((field) => (
                      <div key={field.key} className="space-y-2">
                        <Label className="text-xs text-slate-400">{field.label}</Label>
                        <Select 
                          value={columnMapping[field.key] || ""} 
                          onValueChange={(val) => setColumnMapping(prev => ({ ...prev, [field.key]: val }))}
                        >
                          <SelectTrigger className="h-8 text-xs bg-white/5 border-white/10">
                            <SelectValue placeholder="Select Column" />
                          </SelectTrigger>
                          <SelectContent>
                            {csvHeaders.map(header => (
                              <SelectItem key={header} value={header} className="text-xs">
                                {header}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>

                  <Button 
                    className="w-full mt-4 bg-[#00ffee] text-[#0b1020] hover:bg-[#00ffee]/90 font-bold"
                    onClick={handleMappingComplete}
                    disabled={Object.keys(columnMapping).length < REQUIRED_FIELDS.length}
                  >
                    <ArrowRightLeft className="w-4 h-4 mr-2" />
                    Confirm Mapping & Import
                  </Button>
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

            {uploadState !== 'mapping' && (
              <div className="bg-black/30 p-4 rounded-lg border border-white/5">
                <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Required Schema</h4>
                <div className="grid grid-cols-3 gap-2 text-xs font-mono text-slate-500">
                  {REQUIRED_FIELDS.map(f => (
                    <div key={f.key} className="bg-white/5 p-2 rounded">{f.label}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
