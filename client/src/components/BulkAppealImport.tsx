import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface ParsedAppeal {
  parcelId: string;
  currentValue: number;
  appealedValue: number;
  reason: string;
  hearingDate?: string;
  errors: string[];
}

interface BulkAppealImportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function BulkAppealImport({ open, onOpenChange, onSuccess }: BulkAppealImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedAppeals, setParsedAppeals] = useState<ParsedAppeal[]>([]);
  const [importing, setImporting] = useState(false);

  const createAppeal = trpc.appeals.create.useMutation();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      toast.error("Please select a CSV file");
      return;
    }

    setFile(selectedFile);
    parseCSV(selectedFile);
  };

  const parseCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        toast.error("CSV file is empty or invalid");
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const requiredHeaders = ['parcelid', 'currentvalue', 'appealedvalue', 'reason'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      
      if (missingHeaders.length > 0) {
        toast.error(`Missing required columns: ${missingHeaders.join(', ')}`);
        return;
      }

      const appeals: ParsedAppeal[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const row: Record<string, string> = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });

        const errors: string[] = [];
        
        if (!row.parcelid) errors.push("Missing parcel ID");
        
        const currentValue = parseFloat(row.currentvalue?.replace(/[$,]/g, '') || '0');
        if (isNaN(currentValue) || currentValue <= 0) {
          errors.push("Invalid current value");
        }
        
        const appealedValue = parseFloat(row.appealedvalue?.replace(/[$,]/g, '') || '0');
        if (isNaN(appealedValue) || appealedValue <= 0) {
          errors.push("Invalid appealed value");
        }
        
        if (!row.reason) errors.push("Missing reason");

        appeals.push({
          parcelId: row.parcelid || '',
          currentValue,
          appealedValue,
          reason: row.reason || '',
          hearingDate: row.hearingdate,
          errors
        });
      }

      setParsedAppeals(appeals);
      toast.success(`Parsed ${appeals.length} appeals from CSV`);
    };

    reader.readAsText(file);
  };

  const handleImport = async () => {
    console.log('[BulkImport] handleImport called', { parsedAppeals });
    const validAppeals = parsedAppeals.filter(a => a.errors.length === 0);
    console.log('[BulkImport] validAppeals count:', validAppeals.length);
    
    if (validAppeals.length === 0) {
      toast.error("No valid appeals to import. Please fix errors first.");
      return;
    }

    setImporting(true);
    let successCount = 0;
    let errorCount = 0;

    for (const appeal of validAppeals) {
      try {
        await createAppeal.mutateAsync({
          parcelId: appeal.parcelId,
          currentAssessedValue: appeal.currentValue,
          appealedValue: appeal.appealedValue,
          appealReason: appeal.reason,
          appealDate: new Date().toISOString().split('T')[0],
        });
        successCount++;
      } catch (error) {
        console.error(`Failed to import appeal for ${appeal.parcelId}:`, error);
        errorCount++;
      }
    }

    setImporting(false);
    
    if (successCount > 0) {
      toast.success(`Successfully imported ${successCount} appeals`);
      onSuccess();
      onOpenChange(false);
      setFile(null);
      setParsedAppeals([]);
    }
    
    if (errorCount > 0) {
      toast.error(`Failed to import ${errorCount} appeals`);
    }
  };

  const validCount = parsedAppeals.filter(a => a.errors.length === 0).length;
  const errorCount = parsedAppeals.filter(a => a.errors.length > 0).length;

  if (!open) return null;

  return (
    <>
      {/* Wrapper to handle backdrop clicks */}
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center"
        onClick={(e) => {
          // Close dialog if clicking outside the dialog content
          if (e.target === e.currentTarget) {
            onOpenChange(false);
          }
        }}
      >
        {/* Dialog Content */}
        <div 
          className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-background border border-border rounded-lg shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Bulk Appeal Import</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Upload a CSV file with columns: parcelId, currentValue, appealedValue, reason, hearingDate (optional)
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* File Input */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="csv-file">CSV File</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="flex-1"
                />
                <Button variant="outline" asChild>
                  <a href="/templates/appeals_template.csv" download>
                    Download Template
                  </a>
                </Button>
              </div>
            </div>

            {/* Preview Table */}
            {parsedAppeals.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Badge variant="default">{validCount} valid</Badge>
                  {errorCount > 0 && <Badge variant="destructive">{errorCount} errors</Badge>}
                </div>

                <div className="border rounded-lg max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Row</TableHead>
                        <TableHead>Parcel ID</TableHead>
                        <TableHead>Current Value</TableHead>
                        <TableHead>Appealed Value</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedAppeals.map((appeal, index) => (
                        <TableRow key={index}>
                          <TableCell>{index + 2}</TableCell>
                          <TableCell>{appeal.parcelId || '-'}</TableCell>
                          <TableCell>${appeal.currentValue.toLocaleString()}</TableCell>
                          <TableCell>${appeal.appealedValue.toLocaleString()}</TableCell>
                          <TableCell className="max-w-xs truncate">{appeal.reason || '-'}</TableCell>
                          <TableCell>
                            {appeal.errors.length === 0 ? (
                              <Badge variant="default">Valid</Badge>
                            ) : (
                              <Badge variant="destructive" title={appeal.errors.join(', ')}>
                                {appeal.errors.length} errors
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFile(null);
                      setParsedAppeals([]);
                    }}
                    disabled={importing}
                  >
                    Clear
                  </Button>
                  <button
                    type="button"
                    onClick={() => {
                      console.log('[BulkImport] Native button clicked!');
                      handleImport();
                    }}
                    disabled={validCount === 0 || importing}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                  >
                    {importing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Import {validCount} Appeals
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
      
      {/* Backdrop - Use pointer-events-none so clicks pass through to dialog */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 pointer-events-none"
      />
    </>
  );
}
