import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Upload, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface ParsedAppeal {
  parcelId: string;
  currentValue: number;
  appealedValue: number;
  reason: string;
  hearingDate?: string;
  errors: string[];
  rowNumber: number;
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

      // Parse header
      const header = lines[0].split(',').map(h => h.trim().toLowerCase());
      const parcelIdIndex = header.indexOf('parcelid');
      const currentValueIndex = header.indexOf('currentvalue');
      const appealedValueIndex = header.indexOf('appealedvalue');
      const reasonIndex = header.indexOf('reason');
      const hearingDateIndex = header.indexOf('hearingdate');

      if (parcelIdIndex === -1 || currentValueIndex === -1 || appealedValueIndex === -1 || reasonIndex === -1) {
        toast.error("CSV must have columns: parcelId, currentValue, appealedValue, reason");
        return;
      }

      // Parse data rows
      const appeals: ParsedAppeal[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cells = lines[i].split(',').map(c => c.trim());
        const errors: string[] = [];

        const parcelId = cells[parcelIdIndex] || '';
        const currentValue = parseFloat(cells[currentValueIndex] || '0');
        const appealedValue = parseFloat(cells[appealedValueIndex] || '0');
        const reason = cells[reasonIndex] || '';
        const hearingDate = hearingDateIndex >= 0 ? cells[hearingDateIndex] : undefined;

        // Validation
        if (!parcelId) errors.push("Parcel ID is required");
        if (isNaN(currentValue) || currentValue <= 0) errors.push("Current value must be > 0");
        if (isNaN(appealedValue) || appealedValue <= 0) errors.push("Appealed value must be > 0");
        if (appealedValue >= currentValue) errors.push("Appealed value must be < current value");
        if (!reason) errors.push("Reason is required");

        appeals.push({
          parcelId,
          currentValue,
          appealedValue,
          reason,
          hearingDate,
          errors,
          rowNumber: i + 1,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Appeal Import</DialogTitle>
          <DialogDescription>
            Upload a CSV file with columns: parcelId, currentValue, appealedValue, reason, hearingDate (optional)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="csv-file">CSV File</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const template = "parcelId,currentValue,appealedValue,reason\n" +
                    "123-456-789,500000,450000,Property overvalued based on recent sales\n" +
                    "987-654-321,350000,320000,Comparable properties assessed lower\n" +
                    "555-123-456,275000,250000,Assessment exceeds market value";
                  const blob = new Blob([template], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'appeal_import_template.csv';
                  a.click();
                  URL.revokeObjectURL(url);
                  toast.success("Template downloaded");
                }}
              >
                Download Template
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={importing}
              />
              <Upload className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>

          {parsedAppeals.length > 0 && (
            <>
              <div className="flex items-center gap-4 text-sm">
                <Badge variant="outline" className="gap-1">
                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                  {validCount} valid
                </Badge>
                {errorCount > 0 && (
                  <Badge variant="destructive" className="gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errorCount} errors
                  </Badge>
                )}
              </div>

              <div className="border rounded-md max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Row</TableHead>
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
                        <TableCell className="font-mono text-xs">{appeal.rowNumber}</TableCell>
                        <TableCell className="font-mono">{appeal.parcelId}</TableCell>
                        <TableCell>${appeal.currentValue.toLocaleString()}</TableCell>
                        <TableCell>${appeal.appealedValue.toLocaleString()}</TableCell>
                        <TableCell className="max-w-xs truncate">{appeal.reason}</TableCell>
                        <TableCell>
                          {appeal.errors.length === 0 ? (
                            <Badge variant="outline" className="gap-1">
                              <CheckCircle2 className="w-3 h-3 text-green-500" />
                              Valid
                            </Badge>
                          ) : (
                            <div className="space-y-1">
                              {appeal.errors.map((error, i) => (
                                <Badge key={i} variant="destructive" className="gap-1 text-xs">
                                  <AlertCircle className="w-3 h-3" />
                                  {error}
                                </Badge>
                              ))}
                            </div>
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
                <Button
                  type="button"
                  onClick={handleImport}
                  disabled={validCount === 0 || importing}
                >
                  {importing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Import {validCount} Appeals
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
