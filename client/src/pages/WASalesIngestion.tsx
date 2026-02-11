import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { Upload, Download, CheckCircle2, AlertCircle, Calculator } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface SaleRecord {
  parcelId: string;
  saleDate: string;
  salePrice: number;
  assessedValue: number;
  assessedToSaleRatio?: string;
  propertyType?: string;
  situsAddress?: string;
  countyName?: string;
  squareFeet?: number;
  yearBuilt?: number;
  bedrooms?: number;
  bathrooms?: number;
}

export default function WASalesIngestion() {
  const [salesData, setSalesData] = useState<SaleRecord[]>([]);
  const [selectedCounty, setSelectedCounty] = useState<string>("");
  
  const createSaleMutation = trpc.sales.create.useMutation({
    onSuccess: () => {
      toast.success("Sale record created successfully");
    },
    onError: (error) => {
      toast.error(`Failed to create sale: ${error.message}`);
    },
  });

  const calculateRatio = (assessed: number, sale: number): string => {
    if (sale === 0) return "N/A";
    const ratio = assessed / sale;
    return ratio.toFixed(4);
  };

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n");
      const headers = lines[0].split(",").map(h => h.trim());
      
      const records: SaleRecord[] = [];
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const values = lines[i].split(",").map(v => v.trim());
        const record: any = {};
        
        headers.forEach((header, index) => {
          record[header] = values[index];
        });

        // Calculate ratio automatically
        const assessed = parseInt(record.assessedValue || "0");
        const sale = parseInt(record.salePrice || "0");
        
        records.push({
          parcelId: record.parcelId || "",
          saleDate: record.saleDate || "",
          salePrice: sale,
          assessedValue: assessed,
          assessedToSaleRatio: calculateRatio(assessed, sale),
          propertyType: record.propertyType,
          situsAddress: record.situsAddress,
          countyName: selectedCounty || record.countyName,
          squareFeet: parseInt(record.squareFeet || "0") || undefined,
          yearBuilt: parseInt(record.yearBuilt || "0") || undefined,
          bedrooms: parseInt(record.bedrooms || "0") || undefined,
          bathrooms: parseInt(record.bathrooms || "0") || undefined,
        });
      }
      
      setSalesData(records);
      toast.success(`Loaded ${records.length} sale records`);
    };
    
    reader.readAsText(file);
  };

  const handleBulkImport = async () => {
    if (salesData.length === 0) {
      toast.error("No sales data to import");
      return;
    }

    toast.info(`Importing ${salesData.length} sales records...`);
    
    let successCount = 0;
    let errorCount = 0;

    for (const sale of salesData) {
      try {
        await createSaleMutation.mutateAsync({
          parcelId: sale.parcelId,
          saleDate: new Date(sale.saleDate),
          salePrice: sale.salePrice,
          assessedValue: sale.assessedValue,
          propertyType: sale.propertyType,
          neighborhood: sale.countyName,
          squareFeet: sale.squareFeet,
          yearBuilt: sale.yearBuilt,
        });
        successCount++;
      } catch (error) {
        errorCount++;
      }
    }

    toast.success(`Import complete: ${successCount} success, ${errorCount} errors`);
    if (errorCount === 0) {
      setSalesData([]);
    }
  };

  const downloadTemplate = () => {
    const template = "parcelId,saleDate,salePrice,assessedValue,propertyType,situsAddress,countyName,squareFeet,yearBuilt,bedrooms,bathrooms\n" +
      "12345-001,2024-01-15,350000,340000,Residential,123 Main St,Benton County,2000,1995,3,2\n" +
      "12345-002,2024-02-20,425000,410000,Residential,456 Oak Ave,Benton County,2400,2000,4,2.5";
    
    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sales_import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">WA Sales Data Ingestion</h1>
          <p className="text-muted-foreground mt-2">
            Import comparable sales data for ratio studies and market analysis
          </p>
        </div>

        {/* Import Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Import Sales Data
            </CardTitle>
            <CardDescription>
              Upload CSV file with sales transactions. Ratios will be calculated automatically.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>County</Label>
                <Select value={selectedCounty} onValueChange={setSelectedCounty}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select county" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Benton County">Benton County</SelectItem>
                    <SelectItem value="Franklin County">Franklin County</SelectItem>
                    <SelectItem value="Walla Walla County">Walla Walla County</SelectItem>
                    <SelectItem value="Yakima County">Yakima County</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>CSV File</Label>
                <Input
                  type="file"
                  accept=".csv"
                  onChange={handleCSVUpload}
                  className="cursor-pointer"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={downloadTemplate} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Download Template
              </Button>
              <Button 
                onClick={handleBulkImport} 
                disabled={salesData.length === 0 || createSaleMutation.isPending}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Import {salesData.length} Records
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preview Card */}
        {salesData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Sales Preview ({salesData.length} records)
              </CardTitle>
              <CardDescription>
                Review sales data before importing. Ratios calculated automatically.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-auto max-h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Parcel ID</TableHead>
                      <TableHead>Sale Date</TableHead>
                      <TableHead className="text-right">Sale Price</TableHead>
                      <TableHead className="text-right">Assessed Value</TableHead>
                      <TableHead className="text-right">Ratio (A/S)</TableHead>
                      <TableHead>Property Type</TableHead>
                      <TableHead>Address</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesData.map((sale, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-mono">{sale.parcelId}</TableCell>
                        <TableCell>{sale.saleDate}</TableCell>
                        <TableCell className="text-right">
                          ${sale.salePrice.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          ${sale.assessedValue.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {sale.assessedToSaleRatio}
                        </TableCell>
                        <TableCell>{sale.propertyType || "—"}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {sale.situsAddress || "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="space-y-1 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">CSV Format Requirements</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Required fields: parcelId, saleDate, salePrice, assessedValue</li>
                  <li>Date format: YYYY-MM-DD (e.g., 2024-01-15)</li>
                  <li>Ratios will be calculated automatically as assessedValue / salePrice</li>
                  <li>Optional fields: propertyType, situsAddress, squareFeet, yearBuilt, bedrooms, bathrooms</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
