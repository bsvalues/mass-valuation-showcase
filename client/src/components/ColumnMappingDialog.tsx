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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

interface ColumnMappingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  headers: string[];
  detectedMapping: Record<string, string>;
  sampleRows: Record<string, any>[];
  totalRows: number;
  onConfirm: (mapping: Record<string, string>) => void;
  onPreview: (mapping: Record<string, string>) => void;
  onCancel: () => void;
}

const TARGET_FIELDS = [
  { value: 'parcelId', label: 'Parcel ID', required: true },
  { value: 'address', label: 'Address', required: false },
  { value: 'sqft', label: 'Square Feet', required: false },
  { value: 'yearBuilt', label: 'Year Built', required: false },
  { value: 'landValue', label: 'Land Value', required: false },
  { value: 'buildingValue', label: 'Building Value', required: false },
  { value: 'totalValue', label: 'Total Value', required: false },
  { value: 'bedrooms', label: 'Bedrooms', required: false },
  { value: 'bathrooms', label: 'Bathrooms', required: false },
  { value: 'propertyType', label: 'Property Type', required: false },
  { value: 'zoning', label: 'Zoning', required: false },
  { value: 'lotSize', label: 'Lot Size', required: false },
  { value: 'skip', label: '(Skip this column)', required: false },
];

export function ColumnMappingDialog({
  open,
  onOpenChange,
  headers,
  detectedMapping,
  sampleRows,
  totalRows,
  onConfirm,
  onPreview,
  onCancel,
}: ColumnMappingDialogProps) {
  const [mapping, setMapping] = useState<Record<string, string>>(detectedMapping);

  const handleMappingChange = (sourceColumn: string, targetField: string) => {
    setMapping(prev => ({
      ...prev,
      [targetField]: targetField === 'skip' ? '' : sourceColumn,
    }));
  };

  const getConfidenceLevel = (sourceColumn: string, targetField: string): 'high' | 'medium' | 'low' => {
    const detected = detectedMapping[targetField];
    if (detected === sourceColumn) return 'high';
    if (detected && detected !== sourceColumn) return 'low';
    return 'medium';
  };

  const isValid = mapping.parcelId && mapping.parcelId !== '';

  const handleConfirm = () => {
    // Remove empty mappings
    const cleanedMapping = Object.entries(mapping).reduce((acc, [key, value]) => {
      if (value) acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    
    onConfirm(cleanedMapping);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-cyan-400">Column Mapping</DialogTitle>
          <DialogDescription>
            Map your file columns to TerraForge fields. We've auto-detected the mappings below.
            Review and adjust as needed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Stats */}
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <div className="text-sm text-muted-foreground">Total Rows</div>
              <div className="text-2xl font-bold text-cyan-400">{totalRows.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Columns Detected</div>
              <div className="text-2xl font-bold text-cyan-400">{headers.length}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Auto-Mapped</div>
              <div className="text-2xl font-bold text-cyan-400">
                {Object.values(detectedMapping).filter(v => v).length}
              </div>
            </div>
          </div>

          {/* Mapping Table */}
          <div className="space-y-3">
            {TARGET_FIELDS.filter(f => f.value !== 'skip').map(field => {
              const sourceColumn = mapping[field.value];
              const confidence = sourceColumn ? getConfidenceLevel(sourceColumn, field.value) : 'low';
              
              return (
                <div
                  key={field.value}
                  className="flex items-center gap-4 p-4 border border-border rounded-lg hover:border-cyan-400/50 transition-colors"
                >
                  {/* Target Field */}
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{field.label}</span>
                      {field.required && (
                        <Badge variant="destructive" className="text-xs">Required</Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Target: <code className="text-cyan-400">{field.value}</code>
                    </div>
                  </div>

                  {/* Arrow */}
                  <ArrowRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />

                  {/* Source Column Selector */}
                  <div className="flex-1 min-w-[250px]">
                    <Select
                      value={sourceColumn || 'none'}
                      onValueChange={(value) => handleMappingChange(value === 'none' ? '' : value, field.value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select source column..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">(Not mapped)</SelectItem>
                        {headers.map(header => (
                          <SelectItem key={header} value={header}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Confidence Indicator */}
                  <div className="flex-shrink-0">
                    {sourceColumn && confidence === 'high' && (
                      <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Auto
                      </Badge>
                    )}
                    {sourceColumn && confidence === 'medium' && (
                      <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Manual
                      </Badge>
                    )}
                    {!sourceColumn && field.required && (
                      <Badge variant="destructive">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Missing
                      </Badge>
                    )}
                  </div>

                  {/* Sample Data */}
                  {sourceColumn && sampleRows.length > 0 && (
                    <div className="flex-1 min-w-[150px] text-sm text-muted-foreground truncate">
                      Sample: <span className="text-foreground font-mono">{sampleRows[0][sourceColumn]}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Validation Warning */}
          {!isValid && (
            <div className="flex items-start gap-2 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-destructive">Required Field Missing</div>
                <div className="text-sm text-destructive/80">
                  Parcel ID is required. Please map a source column to this field.
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onPreview(mapping)}
              disabled={!isValid}
              className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
            >
              Preview Data
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!isValid}
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
            >
              Skip Preview & Import
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
