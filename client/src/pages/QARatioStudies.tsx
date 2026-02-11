import { DashboardLayout } from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle2, Download, FileText, TrendingUp, XCircle } from "lucide-react";
import { useState } from "react";

export default function QARatioStudies() {
  const [selectedCounty, setSelectedCounty] = useState<string>("");
  const [selectedPropertyType, setSelectedPropertyType] = useState<string>("");
  const [studyResults, setStudyResults] = useState<any>(null);

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

  const runRatioStudy = () => {
    // In production, this would call a tRPC procedure
    setStudyResults(mockResults);
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            <div className="flex gap-2 mt-6">
              <Button onClick={runRatioStudy} disabled={!selectedCounty || !selectedPropertyType}>
                <TrendingUp className="w-4 h-4 mr-2" />
                Run Ratio Study
              </Button>
              <Button variant="outline" disabled={!studyResults}>
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
                    <div className="text-2xl font-bold">{studyResults.sampleSize.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {studyResults.withinRange} within range, {studyResults.outliers} outliers
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
                      Assessment Level: {studyResults.assessmentLevel}%
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
