import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, CheckCircle2, Info, ArrowLeft } from 'lucide-react';

interface DataPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  headers: string[];
  sampleRows: Record<string, any>[];
  totalRows: number;
  mapping: Record<string, string>;
  onBack: () => void;
  onConfirm: () => void;
}

type DataType = 'string' | 'number' | 'date' | 'boolean' | 'empty';

interface ValidationIssue {
  row: number;
  column: string;
  issue: string;
  severity: 'warning' | 'error';
}

export function DataPreviewDialog({
  open,
  onOpenChange,
  headers,
  sampleRows,
  totalRows,
  mapping,
  onBack,
  onConfirm,
}: DataPreviewDialogProps) {
  const [validationIssues] = useState<ValidationIssue[]>(() => {
    const issues: ValidationIssue[] = [];
    
    // Detect validation issues
    sampleRows.forEach((row, rowIndex) => {
      Object.entries(mapping).forEach(([targetField, sourceColumn]) => {
        const value = row[sourceColumn];
        
        // Check for empty required fields
        if (targetField === 'parcelId' && (!value || String(value).trim() === '')) {
          issues.push({
            row: rowIndex + 1,
            column: sourceColumn,
            issue: 'Parcel ID is required but empty',
            severity: 'error',
          });
        }
        
        // Check for invalid numeric values
        if (['sqft', 'yearBuilt', 'landValue', 'buildingValue'].includes(targetField)) {
          if (value && isNaN(Number(String(value).replace(/[^0-9.-]/g, '')))) {
            issues.push({
              row: rowIndex + 1,
              column: sourceColumn,
              issue: `Expected number, got "${value}"`,
              severity: 'warning',
            });
          }
        }
        
        // Check for suspicious year values
        if (targetField === 'yearBuilt' && value) {
          const year = parseInt(String(value).replace(/[^0-9]/g, ''));
          if (year < 1700 || year > new Date().getFullYear() + 5) {
            issues.push({
              row: rowIndex + 1,
              column: sourceColumn,
              issue: `Suspicious year: ${year}`,
              severity: 'warning',
            });
          }
        }
      });
    });
    
    return issues;
  });

  const detectDataType = (value: any): DataType => {
    if (value === null || value === undefined || String(value).trim() === '') return 'empty';
    
    const strValue = String(value).trim();
    
    // Check for boolean
    if (['true', 'false', 'yes', 'no', '1', '0'].includes(strValue.toLowerCase())) {
      return 'boolean';
    }
    
    // Check for number
    const numValue = Number(strValue.replace(/[^0-9.-]/g, ''));
    if (!isNaN(numValue) && strValue.replace(/[^0-9.-]/g, '') !== '') {
      return 'number';
    }
    
    // Check for date
    const dateValue = new Date(strValue);
    if (!isNaN(dateValue.getTime()) && strValue.match(/\d{1,4}[-/]\d{1,2}[-/]\d{1,4}/)) {
      return 'date';
    }
    
    return 'string';
  };

  const getDataTypeBadge = (type: DataType) => {
    const variants: Record<DataType, { color: string; label: string }> = {
      string: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: 'Text' },
      number: { color: 'bg-green-500/20 text-green-400 border-green-500/30', label: 'Number' },
      date: { color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', label: 'Date' },
      boolean: { color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', label: 'Boolean' },
      empty: { color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', label: 'Empty' },
    };
    
    const variant = variants[type];
    return <Badge className={`text-xs ${variant.color}`}>{variant.label}</Badge>;
  };

  const mappedHeaders = Object.entries(mapping).map(([targetField, sourceColumn]) => ({
    targetField,
    sourceColumn,
    dataType: detectDataType(sampleRows[0]?.[sourceColumn]),
  }));

  const errorCount = validationIssues.filter(i => i.severity === 'error').length;
  const warningCount = validationIssues.filter(i => i.severity === 'warning').length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl text-cyan-400">Data Preview</DialogTitle>
          <DialogDescription>
            Review the first {sampleRows.length} rows of {totalRows.toLocaleString()} total records before importing.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4 py-4">
          {/* Validation Summary */}
          {validationIssues.length > 0 && (
            <div className="flex items-start gap-2 p-4 bg-muted/50 rounded-lg border border-border">
              <Info className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-medium text-foreground mb-2">Data Quality Summary</div>
                <div className="flex gap-4 text-sm">
                  {errorCount > 0 && (
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <span className="text-red-400">{errorCount} error{errorCount !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                  {warningCount > 0 && (
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-500" />
                      <span className="text-amber-400">{warningCount} warning{warningCount !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                  {validationIssues.length === 0 && (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span className="text-green-400">No issues detected</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Data Table */}
          <ScrollArea className="flex-1 border border-border rounded-lg">
            <div className="min-w-max">
              <table className="w-full">
                <thead className="bg-muted/50 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground border-b border-border">
                      Row
                    </th>
                    {mappedHeaders.map(({ targetField, sourceColumn, dataType }) => (
                      <th
                        key={targetField}
                        className="px-4 py-3 text-left text-xs font-medium border-b border-border min-w-[150px]"
                      >
                        <div className="space-y-1">
                          <div className="text-cyan-400 font-semibold">{targetField}</div>
                          <div className="text-muted-foreground font-normal">← {sourceColumn}</div>
                          <div>{getDataTypeBadge(dataType)}</div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sampleRows.map((row, rowIndex) => {
                    const rowIssues = validationIssues.filter(i => i.row === rowIndex + 1);
                    const hasError = rowIssues.some(i => i.severity === 'error');
                    
                    return (
                      <tr
                        key={rowIndex}
                        className={`border-b border-border hover:bg-muted/30 transition-colors ${
                          hasError ? 'bg-red-500/5' : ''
                        }`}
                      >
                        <td className="px-4 py-3 text-sm text-muted-foreground font-mono">
                          {rowIndex + 1}
                        </td>
                        {mappedHeaders.map(({ targetField, sourceColumn }) => {
                          const value = row[sourceColumn];
                          const cellIssue = rowIssues.find(i => i.column === sourceColumn);
                          
                          return (
                            <td key={targetField} className="px-4 py-3 text-sm">
                              <div className="flex items-center gap-2">
                                {cellIssue && (
                                  <div title={cellIssue.issue}>
                                  <AlertCircle
                                    className={`w-4 h-4 flex-shrink-0 ${
                                      cellIssue.severity === 'error' ? 'text-red-500' : 'text-amber-500'
                                    }`}
                                  />
                                </div>
                                )}
                                <span className={`font-mono truncate ${!value ? 'text-muted-foreground italic' : ''}`}>
                                  {value !== null && value !== undefined && String(value).trim() !== ''
                                    ? String(value)
                                    : '(empty)'}
                                </span>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </ScrollArea>

          {/* Validation Issues List */}
          {validationIssues.length > 0 && (
            <div className="space-y-2 max-h-32 overflow-y-auto">
              <div className="text-sm font-medium text-foreground">Detected Issues:</div>
              {validationIssues.slice(0, 5).map((issue, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-2 p-2 rounded text-sm ${
                    issue.severity === 'error'
                      ? 'bg-red-500/10 border border-red-500/30'
                      : 'bg-amber-500/10 border border-amber-500/30'
                  }`}
                >
                  <AlertCircle
                    className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                      issue.severity === 'error' ? 'text-red-500' : 'text-amber-500'
                    }`}
                  />
                  <div>
                    <span className="font-medium">Row {issue.row}, Column "{issue.column}":</span>{' '}
                    <span className={issue.severity === 'error' ? 'text-red-400' : 'text-amber-400'}>
                      {issue.issue}
                    </span>
                  </div>
                </div>
              ))}
              {validationIssues.length > 5 && (
                <div className="text-xs text-muted-foreground pl-6">
                  ... and {validationIssues.length - 5} more issue{validationIssues.length - 5 !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between">
          <Button variant="outline" onClick={onBack} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Mapping
          </Button>
          <Button
            onClick={onConfirm}
            disabled={errorCount > 0}
            className="bg-cyan-500 hover:bg-cyan-600 text-white"
          >
            {errorCount > 0 ? 'Fix Errors to Continue' : `Import ${totalRows.toLocaleString()} Records`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
