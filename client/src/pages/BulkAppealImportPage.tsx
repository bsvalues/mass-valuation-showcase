import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Upload, FileText, CheckCircle2, XCircle, Download } from "lucide-react";
import Papa from "papaparse";

interface ParsedAppeal {
  parcelId: string;
  currentValue: number;
  appealedValue: number;
  reason: string;
  hearingDate?: string;
  isValid: boolean;
  errors: string[];
}

export default function BulkAppealImportPage() {
  const [, setLocation] = useLocation();
  const [parsedAppeals, setParsedAppeals] = useState<ParsedAppeal[]>([]);
  const [importing, setImporting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const createAppeal = trpc.appeals.create.useMutation();
  
  const validateAppeal = (row: any): ParsedAppeal => {
    const errors: string[] = [];
    
    if (!row.parcelId || String(row.parcelId).trim() === '') {
      errors.push('Parcel ID is required');
    }
    
    const currentValue = parseFloat(row.currentValue);
    if (isNaN(currentValue) || currentValue <= 0) {
      errors.push('Current value must be a positive number');
    }
    
    const appealedValue = parseFloat(row.appealedValue);
    if (isNaN(appealedValue) || appealedValue <= 0) {
      errors.push('Appealed value must be a positive number');
    }
    
    if (!row.reason || String(row.reason).trim() === '') {
      errors.push('Reason is required');
    }
    
    return {
      parcelId: String(row.parcelId).trim(),
      currentValue,
      appealedValue,
      reason: String(row.reason).trim(),
      hearingDate: row.hearingDate ? String(row.hearingDate).trim() : undefined,
      isValid: errors.length === 0,
      errors,
    };
  };
  
  const handleFileUpload = useCallback((file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const validated = results.data.map(validateAppeal);
        setParsedAppeals(validated);
        
        const validCount = validated.filter(a => a.isValid).length;
        const invalidCount = validated.length - validCount;
        
        if (invalidCount > 0) {
          toast.warning(`Parsed ${results.data.length} appeals: ${validCount} valid, ${invalidCount} invalid`);
        } else {
          toast.success(`Parsed ${validCount} appeals from CSV`);
        }
      },
      error: (error) => {
        toast.error(`Failed to parse CSV: ${error.message}`);
      }
    });
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);
  
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);
  
  const handleImport = async () => {
    const validAppeals = parsedAppeals.filter(a => a.isValid);
    
    if (validAppeals.length === 0) {
      toast.error('No valid appeals to import');
      return;
    }
    
    setImporting(true);
    
    try {
      let successCount = 0;
      let failCount = 0;
      
      for (const appeal of validAppeals) {
        try {
          await createAppeal.mutateAsync({
            parcelId: appeal.parcelId,
            appealDate: new Date().toISOString(),
            currentAssessedValue: appeal.currentValue,
            appealedValue: appeal.appealedValue,
            appealReason: appeal.reason,
          });
          successCount++;
        } catch (error) {
          console.error('Failed to create appeal:', error);
          failCount++;
        }
      }
      
      if (successCount > 0) {
        toast.success(`Successfully imported ${successCount} appeals`);
      }
      
      if (failCount > 0) {
        toast.error(`Failed to import ${failCount} appeals`);
      }
      
      if (successCount === validAppeals.length) {
        setParsedAppeals([]);
        setLocation('/appeals');
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import appeals');
    } finally {
      setImporting(false);
    }
  };
  
  const downloadTemplate = () => {
    const template = `parcelId,currentValue,appealedValue,reason,hearingDate
123-456-789,500000,450000,Property overvalued based on recent sales,2026-03-15
987-654-321,350000,320000,Comparable properties assessed lower,`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'appeals_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-thin tracking-tight text-foreground">
            Bulk Appeal Import
          </h1>
          <p className="text-muted-foreground mt-1">
            Upload a CSV file to import multiple property tax appeals at once
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Upload CSV File</CardTitle>
            <CardDescription>
              Required columns: parcelId, currentValue, appealedValue, reason. Optional: hearingDate (YYYY-MM-DD)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                isDragging 
                  ? 'border-[#00FFFF] bg-[#00FFFF]/5' 
                  : 'border-border hover:border-[#00FFFF]/50'
              }`}
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">
                {isDragging ? 'Drop CSV file here' : 'Drag and drop CSV file here'}
              </p>
              <p className="text-sm text-muted-foreground mb-4">or</p>
              <label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button variant="outline" asChild>
                  <span>
                    <FileText className="w-4 h-4 mr-2" />
                    Choose File
                  </span>
                </Button>
              </label>
            </div>
            
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={downloadTemplate}>
                <Download className="w-4 h-4 mr-2" />
                Download Template
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {parsedAppeals.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Preview ({parsedAppeals.length} appeals)</CardTitle>
              <CardDescription>
                Review the parsed appeals before importing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-background border-b">
                      <tr>
                        <th className="text-left p-2">Parcel ID</th>
                        <th className="text-left p-2">Current Value</th>
                        <th className="text-left p-2">Appealed Value</th>
                        <th className="text-left p-2">Reason</th>
                        <th className="text-left p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedAppeals.map((appeal, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-2">{appeal.parcelId}</td>
                          <td className="p-2">${appeal.currentValue.toLocaleString()}</td>
                          <td className="p-2">${appeal.appealedValue.toLocaleString()}</td>
                          <td className="p-2 max-w-xs truncate">{appeal.reason}</td>
                          <td className="p-2">
                            {appeal.isValid ? (
                              <Badge variant="default" className="bg-green-500/10 text-green-500 border-green-500/20">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Valid
                              </Badge>
                            ) : (
                              <Badge variant="destructive">
                                <XCircle className="w-3 h-3 mr-1" />
                                Invalid
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    {parsedAppeals.filter(a => a.isValid).length} valid appeals ready to import
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setParsedAppeals([])}
                      disabled={importing}
                    >
                      Clear
                    </Button>
                    <Button
                      onClick={handleImport}
                      disabled={importing || parsedAppeals.filter(a => a.isValid).length === 0}
                    >
                      {importing ? 'Importing...' : `Import ${parsedAppeals.filter(a => a.isValid).length} Appeals`}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
