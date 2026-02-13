import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, FileText, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { exportValueDriverReport } from '@/lib/pdfExport';
import { engineerFeatures, type PropertyFeatures } from '@/lib/featureEngineering';

interface BatchPDFExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  properties: Array<{
    id: number;
    parcelNumber: string;
    siteAddress: string;
    squareFeet: number;
    yearBuilt: number;
    totalValue: number;
    landValue: number;
    buildingValue: number;
    bedrooms?: number;
    bathrooms?: number;
    propertyType?: string;
  }>;
}

interface ExportStatus {
  id: number;
  parcelNumber: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  error?: string;
}

export function BatchPDFExportDialog({
  open,
  onOpenChange,
  properties,
}: BatchPDFExportDialogProps) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatuses, setExportStatuses] = useState<ExportStatus[]>([]);
  const [progress, setProgress] = useState(0);

  const handleSelectAll = () => {
    if (selectedIds.size === properties.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(properties.map(p => p.id)));
    }
  };

  const handleToggleProperty = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleExport = async () => {
    const selectedProperties = properties.filter(p => selectedIds.has(p.id));
    
    if (selectedProperties.length === 0) {
      return;
    }

    setIsExporting(true);
    setProgress(0);

    // Initialize statuses
    const statuses: ExportStatus[] = selectedProperties.map(p => ({
      id: p.id,
      parcelNumber: p.parcelNumber,
      status: 'pending',
    }));
    setExportStatuses(statuses);

    // Process each property
    for (let i = 0; i < selectedProperties.length; i++) {
      const property = selectedProperties[i];
      
      // Update status to processing
      setExportStatuses(prev => 
        prev.map(s => s.id === property.id ? { ...s, status: 'processing' } : s)
      );

      try {
        // Convert to PropertyFeatures format
        const propertyFeatures: PropertyFeatures = {
          squareFeet: property.squareFeet,
          yearBuilt: property.yearBuilt,
          totalValue: property.totalValue,
          landValue: property.landValue,
          buildingValue: property.buildingValue,
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          propertyType: property.propertyType,
        };

        // Engineer features
        const engineeredFeatures = engineerFeatures(propertyFeatures);

        // Calculate predicted value (simplified)
        const predictedValue = property.totalValue || 0;

        // Mock feature importance
        const featureImportance = [
          { name: 'Square Footage', importance: 35 },
          { name: 'Location Score', importance: 25 },
          { name: 'Quality', importance: 15 },
          { name: 'Condition', importance: 12 },
          { name: 'Effective Age', importance: 8 },
          { name: 'Lot Size', importance: 5 },
        ];

        // Generate PDF
        await exportValueDriverReport({
          property: propertyFeatures,
          engineeredFeatures,
          predictedValue,
          featureImportance,
        });

        // Update status to success
        setExportStatuses(prev => 
          prev.map(s => s.id === property.id ? { ...s, status: 'success' } : s)
        );

        // Small delay between exports to prevent browser freezing
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        // Update status to error
        setExportStatuses(prev => 
          prev.map(s => s.id === property.id 
            ? { ...s, status: 'error', error: error instanceof Error ? error.message : 'Unknown error' } 
            : s
          )
        );
      }

      // Update progress
      setProgress(((i + 1) / selectedProperties.length) * 100);
    }

    setIsExporting(false);
  };

  const handleClose = () => {
    if (!isExporting) {
      onOpenChange(false);
      // Reset state after closing
      setTimeout(() => {
        setSelectedIds(new Set());
        setExportStatuses([]);
        setProgress(0);
      }, 300);
    }
  };

  const successCount = exportStatuses.filter(s => s.status === 'success').length;
  const errorCount = exportStatuses.filter(s => s.status === 'error').length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] bg-[var(--color-glass-2)] border-white/10">
        <DialogHeader>
          <DialogTitle className="text-[var(--color-text-primary)] flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Batch PDF Export
          </DialogTitle>
          <DialogDescription>
            Select properties to generate value driver analysis reports
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!isExporting && exportStatuses.length === 0 && (
            <>
              {/* Selection Controls */}
              <div className="flex items-center justify-between p-3 bg-[var(--color-glass-1)] rounded-lg">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedIds.size === properties.length}
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="text-sm text-[var(--color-text-secondary)]">
                    Select All ({properties.length} properties)
                  </span>
                </div>
                <span className="text-sm font-medium text-[var(--color-signal-primary)]">
                  {selectedIds.size} selected
                </span>
              </div>

              {/* Property List */}
              <ScrollArea className="h-[300px] rounded-lg border border-white/10">
                <div className="p-4 space-y-2">
                  {properties.map((property) => (
                    <div
                      key={property.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-glass-1)] hover:bg-[var(--color-glass-2)] transition-colors cursor-pointer"
                      onClick={() => handleToggleProperty(property.id)}
                    >
                      <Checkbox
                        checked={selectedIds.has(property.id)}
                        onCheckedChange={() => handleToggleProperty(property.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                          {property.siteAddress || 'Address not available'}
                        </p>
                        <p className="text-xs text-[var(--color-text-tertiary)]">
                          Parcel #{property.parcelNumber} • {property.squareFeet?.toLocaleString()} sq ft • ${property.totalValue?.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </>
          )}

          {/* Export Progress */}
          {(isExporting || exportStatuses.length > 0) && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--color-text-secondary)]">
                    {isExporting ? 'Generating reports...' : 'Export complete'}
                  </span>
                  <span className="text-[var(--color-text-primary)] font-medium">
                    {Math.round(progress)}%
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              {/* Status Summary */}
              {!isExporting && (
                <div className="flex items-center gap-4 p-3 bg-[var(--color-glass-1)] rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-[var(--color-text-secondary)]">
                      {successCount} successful
                    </span>
                  </div>
                  {errorCount > 0 && (
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-400" />
                      <span className="text-sm text-[var(--color-text-secondary)]">
                        {errorCount} failed
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Status List */}
              <ScrollArea className="h-[250px] rounded-lg border border-white/10">
                <div className="p-4 space-y-2">
                  {exportStatuses.map((status) => (
                    <div
                      key={status.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-glass-1)]"
                    >
                      {status.status === 'pending' && (
                        <div className="w-5 h-5 rounded-full border-2 border-gray-500" />
                      )}
                      {status.status === 'processing' && (
                        <Loader2 className="w-5 h-5 text-[var(--color-signal-primary)] animate-spin" />
                      )}
                      {status.status === 'success' && (
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                      )}
                      {status.status === 'error' && (
                        <XCircle className="w-5 h-5 text-red-400" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--color-text-primary)]">
                          Parcel #{status.parcelNumber}
                        </p>
                        {status.error && (
                          <p className="text-xs text-red-400 mt-1">{status.error}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isExporting}
          >
            {exportStatuses.length > 0 ? 'Close' : 'Cancel'}
          </Button>
          {exportStatuses.length === 0 && (
            <Button
              onClick={handleExport}
              disabled={selectedIds.size === 0 || isExporting}
              className="bg-[var(--color-signal-primary)] hover:bg-[var(--color-signal-primary)]/90"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export {selectedIds.size} Report{selectedIds.size !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
