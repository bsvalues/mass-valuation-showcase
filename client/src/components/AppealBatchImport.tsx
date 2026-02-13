/**
 * Appeal Batch Import Component
 * CSV upload with column mapping for bulk appeal creation
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, CheckCircle2, AlertCircle, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import Papa from "papaparse";

interface ColumnMapping {
  parcelId: string;
  appealDate: string;
  currentAssessedValue: string;
  appealedValue: string;
  finalValue: string;
  status: string;
  appealReason: string;
  resolution: string;
  countyName: string;
  ownerEmail: string;
  hearingDate: string;
  resolutionDate: string;
}

const REQUIRED_FIELDS = [
  { key: "parcelId", label: "Parcel ID", required: true },
  { key: "appealDate", label: "Appeal Date", required: true },
  { key: "currentAssessedValue", label: "Current Assessed Value", required: true },
  { key: "appealedValue", label: "Appealed Value", required: true },
  { key: "status", label: "Status", required: true },
  { key: "appealReason", label: "Appeal Reason", required: true },
  { key: "countyName", label: "County Name", required: true },
  { key: "ownerEmail", label: "Owner Email", required: true },
] as const;

const OPTIONAL_FIELDS = [
  { key: "finalValue", label: "Final Value" },
  { key: "resolution", label: "Resolution" },
  { key: "hearingDate", label: "Hearing Date" },
  { key: "resolutionDate", label: "Resolution Date" },
] as const;

export function AppealBatchImport({ onSuccess }: { onSuccess?: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [columnMapping, setColumnMapping] = useState<Partial<ColumnMapping>>({});
  const [step, setStep] = useState<"upload" | "mapping" | "preview">("upload");

  const bulkImportMutation = trpc.appeals.bulkImport.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      resetState();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(`Import failed: ${error.message}`);
    },
  });

  const resetState = () => {
    setFile(null);
    setCsvHeaders([]);
    setCsvData([]);
    setColumnMapping({});
    setStep("upload");
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    if (!uploadedFile.name.endsWith(".csv")) {
      toast.error("Please upload a CSV file");
      return;
    }

    setFile(uploadedFile);

    // Parse CSV
    Papa.parse(uploadedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data.length === 0) {
          toast.error("CSV file is empty");
          return;
        }

        const headers = Object.keys(results.data[0] as object);
        setCsvHeaders(headers);
        setCsvData(results.data);

        // Auto-map columns with exact matches
        const autoMapping: Partial<ColumnMapping> = {};
        [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS].forEach((field) => {
          const matchingHeader = headers.find(
            (h) => h.toLowerCase() === field.key.toLowerCase()
          );
          if (matchingHeader) {
            autoMapping[field.key as keyof ColumnMapping] = matchingHeader;
          }
        });
        setColumnMapping(autoMapping);

        setStep("mapping");
        toast.success(`Loaded ${results.data.length} rows from CSV`);
      },
      error: (error) => {
        toast.error(`Failed to parse CSV: ${error.message}`);
      },
    });
  };

  const handleImport = async () => {
    // Validate required mappings
    const missingFields = REQUIRED_FIELDS.filter(
      (field) => !columnMapping[field.key as keyof ColumnMapping]
    );

    if (missingFields.length > 0) {
      toast.error(`Missing required field mappings: ${missingFields.map((f) => f.label).join(", ")}`);
      return;
    }

    // Transform CSV data to appeal objects
    const appealsToImport = csvData.map((row) => {
      const appeal: any = {};

      // Map required fields
      REQUIRED_FIELDS.forEach((field) => {
        const csvColumn = columnMapping[field.key as keyof ColumnMapping];
        if (csvColumn) {
          let value = row[csvColumn];

          // Parse numbers
          if (field.key === "currentAssessedValue" || field.key === "appealedValue") {
            value = parseFloat(value.toString().replace(/[^0-9.-]/g, ""));
          }

          appeal[field.key] = value;
        }
      });

      // Map optional fields
      OPTIONAL_FIELDS.forEach((field) => {
        const csvColumn = columnMapping[field.key as keyof ColumnMapping];
        if (csvColumn && row[csvColumn]) {
          let value = row[csvColumn];

          // Parse numbers
          if (field.key === "finalValue") {
            value = parseFloat(value.toString().replace(/[^0-9.-]/g, ""));
          }

          appeal[field.key] = value;
        }
      });

      return appeal;
    });

    // Execute import
    bulkImportMutation.mutate({ appeals: appealsToImport });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Batch Import Appeals
        </CardTitle>
        <CardDescription>
          Upload a CSV file to import multiple appeals at once
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Step 1: File Upload */}
        {step === "upload" && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <Label htmlFor="csv-upload" className="cursor-pointer">
                <div className="text-sm text-muted-foreground mb-2">
                  Click to upload or drag and drop
                </div>
                <div className="text-xs text-muted-foreground">CSV files only</div>
              </Label>
              <input
                id="csv-upload"
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="text-sm font-medium mb-2">Required Columns:</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                {REQUIRED_FIELDS.map((field) => (
                  <li key={field.key}>• {field.label}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Step 2: Column Mapping */}
        {step === "mapping" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium">Map CSV Columns</h3>
                <p className="text-xs text-muted-foreground">
                  {csvData.length} rows loaded from {file?.name}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={resetState}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-medium text-destructive">Required Fields</h4>
              {REQUIRED_FIELDS.map((field) => (
                <div key={field.key} className="grid grid-cols-2 gap-4 items-center">
                  <Label className="text-sm">{field.label}</Label>
                  <Select
                    value={columnMapping[field.key as keyof ColumnMapping] || ""}
                    onValueChange={(value) =>
                      setColumnMapping((prev) => ({ ...prev, [field.key]: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select column..." />
                    </SelectTrigger>
                    <SelectContent>
                      {csvHeaders.map((header) => (
                        <SelectItem key={header} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}

              <h4 className="text-sm font-medium text-muted-foreground pt-4">Optional Fields</h4>
              {OPTIONAL_FIELDS.map((field) => (
                <div key={field.key} className="grid grid-cols-2 gap-4 items-center">
                  <Label className="text-sm text-muted-foreground">{field.label}</Label>
                  <Select
                    value={columnMapping[field.key as keyof ColumnMapping] || ""}
                    onValueChange={(value) =>
                      setColumnMapping((prev) => ({ ...prev, [field.key]: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Skip (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__skip__">Skip</SelectItem>
                      {csvHeaders.map((header) => (
                        <SelectItem key={header} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleImport} disabled={bulkImportMutation.isPending} className="flex-1">
                {bulkImportMutation.isPending ? (
                  <>Importing...</>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Import {csvData.length} Appeals
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Import Status */}
        {bulkImportMutation.isError && (
          <div className="flex items-start gap-2 p-4 bg-destructive/10 border border-destructive rounded-lg">
            <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div className="text-sm text-destructive">
              {bulkImportMutation.error.message}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
