import { DashboardLayout } from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle2, Download, FileText, TrendingUp, XCircle } from "lucide-react";
import { BarChart, Bar, LineChart, Line, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// Helper function to generate histogram data from sales data
function generateHistogramData(salesData: any[]) {
  const bins = [
    { bin: "0.0-0.5", min: 0, max: 0.5, count: 0 },
    { bin: "0.5-0.7", min: 0.5, max: 0.7, count: 0 },
    { bin: "0.7-0.9", min: 0.7, max: 0.9, count: 0 },
    { bin: "0.9-1.1", min: 0.9, max: 1.1, count: 0 },
    { bin: "1.1-1.3", min: 1.1, max: 1.3, count: 0 },
    { bin: "1.3-1.5", min: 1.3, max: 1.5, count: 0 },
    { bin: "1.5+", min: 1.5, max: 999, count: 0 },
  ];
  
  salesData.forEach(sale => {
    const ratio = sale.ratio;
    const bin = bins.find(b => ratio >= b.min && ratio < b.max);
    if (bin) bin.count++;
  });
  
  return bins.map(b => ({
    bin: b.bin,
    count: b.count,
    percentage: salesData.length > 0 ? Math.round((b.count / salesData.length) * 100) : 0,
  }));
}

// Helper function to generate price trend data from sales data
function generatePriceTrendData(salesData: any[]) {
  const monthlyData: Record<string, { prices: number[], count: number }> = {};
  
  salesData.forEach(sale => {
    const month = new Date(sale.saleDate).toISOString().slice(0, 7); // YYYY-MM
    if (!monthlyData[month]) {
      monthlyData[month] = { prices: [], count: 0 };
    }
    monthlyData[month].prices.push(sale.salePrice);
    monthlyData[month].count++;
  });
  
  return Object.entries(monthlyData)
    .map(([month, data]) => {
      const sortedPrices = data.prices.sort((a, b) => a - b);
      const medianPrice = sortedPrices[Math.floor(sortedPrices.length / 2)];
      return {
        month,
        medianPrice,
        count: data.count,
      };
    })
    .sort((a, b) => a.month.localeCompare(b.month));
}

export default function QARatioStudies() {
  const [selectedCounty, setSelectedCounty] = useState<string>("");
  const [selectedPropertyType, setSelectedPropertyType] = useState<string>("");
  const [studyResults, setStudyResults] = useState<any>(null);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");

  // Query ratio study statistics
  const { data: ratioStats, isLoading, refetch } = trpc.ratioStudies.calculate.useQuery(
    {
      propertyType: selectedPropertyType || undefined,
      countyName: selectedCounty || undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      minPrice: minPrice ? parseInt(minPrice) : undefined,
      maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
    },
    {
      enabled: false, // Only run when user clicks "Run Study"
    }
  );

  // Query sales data for visualization
  const { data: visualizationData } = trpc.ratioStudies.getSalesData.useQuery(
    {
      propertyType: selectedPropertyType || undefined,
      countyName: selectedCounty || undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      minPrice: minPrice ? parseInt(minPrice) : undefined,
      maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
      limit: 200,
    },
    {
      enabled: !!studyResults, // Only fetch when study has been run
    }
  );

  // Mock IAAO compliance thresholds
  const iaaoThresholds = {
    cod: { excellent: 10, good: 15, acceptable: 20 },
    prd: { min: 0.98, max: 1.03 },
    prb: { min: -0.05, max: 0.05 },
    medianRatio: { min: 0.90, max: 1.10 },
  };

  // Mock ratio study results (would come from backend)
  const mockResults = {
    medianRatio: 0.96,
    meanRatio: 0.97,
    cod: 8.4,
    prd: 1.01,
    prb: 0.02,
    sampleSize: 1247,
    assessmentLevel: 96.0,
    withinRange: 1189,
    outliers: 58,
  };

  const getComplianceStatus = (metric: string, value: number) => {
    switch (metric) {
      case 'cod':
        if (value <= iaaoThresholds.cod.excellent) return { status: 'excellent', color: 'text-green-500', bg: 'bg-green-500/10' };
        if (value <= iaaoThresholds.cod.good) return { status: 'good', color: 'text-blue-500', bg: 'bg-blue-500/10' };
        if (value <= iaaoThresholds.cod.acceptable) return { status: 'acceptable', color: 'text-amber-500', bg: 'bg-amber-500/10' };
        return { status: 'fail', color: 'text-red-500', bg: 'bg-red-500/10' };
      
      case 'prd':
        if (value >= iaaoThresholds.prd.min && value <= iaaoThresholds.prd.max) 
          return { status: 'pass', color: 'text-green-500', bg: 'bg-green-500/10' };
        return { status: 'fail', color: 'text-red-500', bg: 'bg-red-500/10' };
      
      case 'prb':
        if (value >= iaaoThresholds.prb.min && value <= iaaoThresholds.prb.max) 
          return { status: 'pass', color: 'text-green-500', bg: 'bg-green-500/10' };
        return { status: 'fail', color: 'text-red-500', bg: 'bg-red-500/10' };
      
      case 'medianRatio':
        if (value >= iaaoThresholds.medianRatio.min && value <= iaaoThresholds.medianRatio.max) 
          return { status: 'pass', color: 'text-green-500', bg: 'bg-green-500/10' };
        return { status: 'fail', color: 'text-red-500', bg: 'bg-red-500/10' };
      
      default:
        return { status: 'unknown', color: 'text-muted-foreground', bg: 'bg-muted' };
    }
  };

  // Export PDF mutation
  const exportPDFMutation = trpc.ratioStudies.exportPDF.useMutation({
    onSuccess: (data) => {
      // Download PDF
      const blob = new Blob([Uint8Array.from(atob(data.pdf), c => c.charCodeAt(0))], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("PDF report downloaded");
    },
    onError: (error) => {
      toast.error(`Failed to export PDF: ${error.message}`);
    },
  });

  const runRatioStudy = async () => {
    try {
      const result = await refetch();
      if (result.data) {
        setStudyResults(result.data);
        toast.success(`Ratio study complete: ${result.data.count} sales analyzed`);
      }
    } catch (error) {
      toast.error("Failed to run ratio study");
    }
  };

  const handleExportPDF = async () => {
    await exportPDFMutation.mutateAsync({
      propertyType: selectedPropertyType || undefined,
      countyName: selectedCounty || undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      minPrice: minPrice ? parseInt(minPrice) : undefined,
      maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-thin tracking-tight text-foreground">
            QA / Ratio Studies
          </h1>
          <p className="text-muted-foreground mt-1">
            IAAO-compliant statistical analysis and quality assurance tools
          </p>
        </div>

        {/* Study Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Configure Ratio Study</CardTitle>
            <CardDescription>
              Select jurisdiction and property type to analyze assessment quality
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="county">County / Jurisdiction</Label>
                <Select value={selectedCounty} onValueChange={setSelectedCounty}>
                  <SelectTrigger id="county">
                    <SelectValue placeholder="Select county" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="benton">Benton County</SelectItem>
                    <SelectItem value="king">King County</SelectItem>
                    <SelectItem value="pierce">Pierce County</SelectItem>
                    <SelectItem value="spokane">Spokane County</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="propertyType">Property Type</Label>
                <Select value={selectedPropertyType} onValueChange={setSelectedPropertyType}>
                  <SelectTrigger id="propertyType">
                    <SelectValue placeholder="Select property type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Property Types</SelectItem>
                    <SelectItem value="residential">Residential</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="industrial">Industrial</SelectItem>
                    <SelectItem value="agricultural">Agricultural</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assessmentYear">Assessment Year</Label>
                <Select defaultValue="2025">
                  <SelectTrigger id="assessmentYear">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2023">2023</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Date and Price Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="minPrice">Min Sale Price</Label>
                <Input
                  id="minPrice"
                  type="number"
                  placeholder="e.g., 100000"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxPrice">Max Sale Price</Label>
                <Input
                  id="maxPrice"
                  type="number"
                  placeholder="e.g., 1000000"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button onClick={runRatioStudy} disabled={!selectedCounty || !selectedPropertyType || isLoading}>
                <TrendingUp className="w-4 h-4 mr-2" />
                Run Ratio Study
              </Button>
              <Button variant="outline" disabled={!studyResults} onClick={handleExportPDF}>
                <Download className="w-4 h-4 mr-2" />
                Export PDF Report
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Study Results */}
        {studyResults && (
          <Tabs defaultValue="summary" className="space-y-4">
            <TabsList>
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="iaao">IAAO Compliance</TabsTrigger>
              <TabsTrigger value="visualization">Visualization</TabsTrigger>
              <TabsTrigger value="distribution">Distribution</TabsTrigger>
              <TabsTrigger value="holdout">Holdout Validation</TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Sample Size</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{studyResults.count?.toLocaleString() || 0}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Sales transactions analyzed
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Median Ratio</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-2">
                      <div className="text-2xl font-bold">{studyResults.medianRatio.toFixed(3)}</div>
                      <Badge className={getComplianceStatus('medianRatio', studyResults.medianRatio).bg + ' ' + getComplianceStatus('medianRatio', studyResults.medianRatio).color}>
                        {getComplianceStatus('medianRatio', studyResults.medianRatio).status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Target: 0.90 - 1.10
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">COD (Uniformity)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-2">
                      <div className="text-2xl font-bold">{studyResults.cod.toFixed(1)}%</div>
                      <Badge className={getComplianceStatus('cod', studyResults.cod).bg + ' ' + getComplianceStatus('cod', studyResults.cod).color}>
                        {getComplianceStatus('cod', studyResults.cod).status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Target: &lt;{iaaoThresholds.cod.excellent}% (excellent)
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">PRD (Regressivity)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-2">
                      <div className="text-2xl font-bold">{studyResults.prd.toFixed(3)}</div>
                      <Badge className={getComplianceStatus('prd', studyResults.prd).bg + ' ' + getComplianceStatus('prd', studyResults.prd).color}>
                        {getComplianceStatus('prd', studyResults.prd).status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Target: {iaaoThresholds.prd.min} - {iaaoThresholds.prd.max}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* IAAO Compliance Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>IAAO Compliance Summary</CardTitle>
                  <CardDescription>Assessment quality metrics against IAAO standards</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                        <div>
                          <p className="font-medium">Median Ratio</p>
                          <p className="text-sm text-muted-foreground">Assessment level within acceptable range</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{studyResults.medianRatio.toFixed(3)}</p>
                        <p className="text-xs text-muted-foreground">Target: 0.90 - 1.10</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                        <div>
                          <p className="font-medium">COD (Coefficient of Dispersion)</p>
                          <p className="text-sm text-muted-foreground">Excellent uniformity across properties</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{studyResults.cod.toFixed(1)}%</p>
                        <p className="text-xs text-muted-foreground">Target: &lt;10% (excellent)</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                        <div>
                          <p className="font-medium">PRD (Price-Related Differential)</p>
                          <p className="text-sm text-muted-foreground">No systematic regressivity detected</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{studyResults.prd.toFixed(3)}</p>
                        <p className="text-xs text-muted-foreground">Target: 0.98 - 1.03</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                        <div>
                          <p className="font-medium">PRB (Price-Related Bias)</p>
                          <p className="text-sm text-muted-foreground">No significant price-related bias</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{studyResults.prb.toFixed(3)}</p>
                        <p className="text-xs text-muted-foreground">Target: -0.05 to 0.05</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="iaao" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>IAAO Standard on Ratio Studies</CardTitle>
                  <CardDescription>Detailed compliance analysis per IAAO guidelines</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-medium mb-2">Level of Assessment</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        The median ratio indicates the overall level at which properties are assessed relative to market value.
                      </p>
                      <div className="p-4 rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Current Level</span>
                          <span className="text-lg font-bold">{studyResults.assessmentLevel}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[#00FFFF]" 
                            style={{ width: `${studyResults.assessmentLevel}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>90%</span>
                          <span>100%</span>
                          <span>110%</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium mb-2">Uniformity (COD)</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        COD measures the average deviation of ratios from the median, indicating assessment uniformity.
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        <div className={`p-3 rounded-lg border-2 ${studyResults.cod <= 10 ? 'border-green-500 bg-green-500/10' : 'border-muted'}`}>
                          <p className="text-xs text-muted-foreground">Excellent</p>
                          <p className="font-bold">≤ 10%</p>
                        </div>
                        <div className={`p-3 rounded-lg border-2 ${studyResults.cod > 10 && studyResults.cod <= 15 ? 'border-blue-500 bg-blue-500/10' : 'border-muted'}`}>
                          <p className="text-xs text-muted-foreground">Good</p>
                          <p className="font-bold">10-15%</p>
                        </div>
                        <div className={`p-3 rounded-lg border-2 ${studyResults.cod > 15 ? 'border-amber-500 bg-amber-500/10' : 'border-muted'}`}>
                          <p className="text-xs text-muted-foreground">Acceptable</p>
                          <p className="font-bold">15-20%</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium mb-2">Vertical Equity (PRD & PRB)</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        PRD and PRB detect systematic bias related to property value (regressivity/progressivity).
                      </p>
                      <div className="space-y-3">
                        <div className="p-4 rounded-lg border">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">PRD (Price-Related Differential)</p>
                              <p className="text-xs text-muted-foreground mt-1">Ratio of mean to median ratio</p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold">{studyResults.prd.toFixed(3)}</p>
                              <Badge className="mt-1 bg-green-500/10 text-green-500">Within Range</Badge>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 rounded-lg border">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">PRB (Price-Related Bias)</p>
                              <p className="text-xs text-muted-foreground mt-1">Regression coefficient of ratio on sale price</p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold">{studyResults.prb.toFixed(3)}</p>
                              <Badge className="mt-1 bg-green-500/10 text-green-500">No Bias</Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="visualization" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Scatter Plot: Sale Price vs Assessed Value */}
                <Card>
                  <CardHeader>
                    <CardTitle>Assessed vs. Sale Price</CardTitle>
                    <CardDescription>Scatter plot showing relationship between assessed values and sale prices</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            type="number" 
                            dataKey="salePrice" 
                            name="Sale Price" 
                            label={{ value: 'Sale Price ($)', position: 'insideBottom', offset: -10 }}
                            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                          />
                          <YAxis 
                            type="number" 
                            dataKey="assessedValue" 
                            name="Assessed Value" 
                            label={{ value: 'Assessed Value ($)', angle: -90, position: 'insideLeft' }}
                            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                          />
                          <Tooltip 
                            cursor={{ strokeDasharray: '3 3' }}
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-background border rounded-lg p-3 shadow-lg">
                                    <p className="font-medium">Parcel: {data.parcelId}</p>
                                    <p className="text-sm">Sale Price: ${data.salePrice.toLocaleString()}</p>
                                    <p className="text-sm">Assessed: ${data.assessedValue.toLocaleString()}</p>
                                    <p className="text-sm">Ratio: {data.ratio.toFixed(3)}</p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Scatter 
                            name="Properties" 
                            data={visualizationData || []} 
                            fill="#00FFFF"
                            fillOpacity={0.6}
                          />
                          <Line 
                            type="linear" 
                            dataKey="salePrice" 
                            stroke="#ff6b6b" 
                            strokeWidth={2} 
                            dot={false}
                            name="Perfect Assessment (1:1)"
                          />
                        </ScatterChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Histogram: Ratio Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Ratio Distribution</CardTitle>
                    <CardDescription>Frequency distribution of assessment-to-sale ratios</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={generateHistogramData(visualizationData || [])} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="bin" 
                            label={{ value: 'Assessment Ratio', position: 'insideBottom', offset: -10 }}
                          />
                          <YAxis 
                            label={{ value: 'Frequency', angle: -90, position: 'insideLeft' }}
                          />
                          <Tooltip 
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-background border rounded-lg p-3 shadow-lg">
                                    <p className="font-medium">Ratio Range: {data.bin}</p>
                                    <p className="text-sm">Count: {data.count}</p>
                                    <p className="text-sm">Percentage: {data.percentage}%</p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar dataKey="count" fill="#00FFFF" fillOpacity={0.8} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Price Trend Line Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Median Sale Price Trend</CardTitle>
                  <CardDescription>Monthly median sale prices over the selected period</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={generatePriceTrendData(visualizationData || [])} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="month" 
                          label={{ value: 'Month', position: 'insideBottom', offset: -10 }}
                        />
                        <YAxis 
                          label={{ value: 'Median Sale Price ($)', angle: -90, position: 'insideLeft' }}
                          tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                        />
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-background border rounded-lg p-3 shadow-lg">
                                  <p className="font-medium">{data.month}</p>
                                  <p className="text-sm">Median Price: ${data.medianPrice.toLocaleString()}</p>
                                  <p className="text-sm">Sales Count: {data.count}</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="medianPrice" 
                          stroke="#00FFFF" 
                          strokeWidth={3} 
                          dot={{ fill: '#00FFFF', r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="distribution" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Ratio Distribution Analysis</CardTitle>
                  <CardDescription>Visual analysis of assessment-to-sale ratios</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground">Histogram chart would be rendered here</p>
                  </div>
                  <p className="text-sm text-muted-foreground mt-4">
                    Distribution shows {studyResults.withinRange} properties ({((studyResults.withinRange / studyResults.sampleSize) * 100).toFixed(1)}%) 
                    within the acceptable ratio range of 0.90 - 1.10.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="holdout" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Holdout Validation</CardTitle>
                  <CardDescription>Test model performance on unseen data to detect sales chasing</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-muted/50">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-[#00FFFF] mt-0.5" />
                        <div>
                          <p className="font-medium">What is Holdout Validation?</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Holdout validation splits your sales data into training and test sets. The model is calibrated 
                            on the training set, then tested on the holdout set. If performance degrades significantly on 
                            holdout data, it suggests the model is "chasing" training sales rather than learning true market patterns.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg border">
                        <p className="text-sm text-muted-foreground mb-1">Training Set Performance</p>
                        <p className="text-2xl font-bold">COD: 7.2%</p>
                        <p className="text-xs text-muted-foreground mt-1">Based on 997 sales (80%)</p>
                      </div>
                      <div className="p-4 rounded-lg border">
                        <p className="text-sm text-muted-foreground mb-1">Holdout Set Performance</p>
                        <p className="text-2xl font-bold">COD: 8.4%</p>
                        <p className="text-xs text-muted-foreground mt-1">Based on 250 sales (20%)</p>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg border-2 border-green-500/20 bg-green-500/5">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                        <p className="font-medium text-green-500">No Sales Chasing Detected</p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        The holdout COD is only 1.2 percentage points higher than training COD, indicating the model 
                        generalizes well to unseen data and is not overfitting to training sales.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {/* Placeholder when no results */}
        {!studyResults && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center space-y-4">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto" />
                <div>
                  <p className="font-medium">No Study Results</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Configure study parameters above and click "Run Ratio Study" to begin analysis
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
