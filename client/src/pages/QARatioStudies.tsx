import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart3, CheckCircle2, TrendingUp, AlertTriangle } from "lucide-react";

export default function QARatioStudies() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-2xl min-h-[300px] flex items-center">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-transparent z-0 pointer-events-none" />
          
          <div className="relative z-10 p-8 md:p-12 w-full">
            <Badge variant="outline" className="bg-primary-foreground/10 text-primary-foreground border-primary-foreground/20 backdrop-blur-sm px-4 py-1 mb-4">
              Quality Assurance & Statistical Validation
            </Badge>
            <h1 className="text-4xl md:text-5xl font-thin tracking-tight leading-tight mb-4">
              QA / Ratio Studies
            </h1>
            <p className="text-primary-foreground/90 text-lg font-light max-w-2xl leading-relaxed">
              Prove model behavior, avoid sales chasing, and maintain defensible uniformity through rigorous statistical analysis.
            </p>
          </div>
        </div>

        {/* Key Metrics Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Median Ratio (A/S)</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0.96</div>
              <p className="text-xs text-muted-foreground flex items-center mt-1">
                <CheckCircle2 className="w-3 h-3 text-green-500 mr-1" />
                Within target range (0.90 - 1.10)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">COD (Uniformity)</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8.4%</div>
              <p className="text-xs text-muted-foreground flex items-center mt-1">
                <CheckCircle2 className="w-3 h-3 text-green-500 mr-1" />
                Excellent uniformity (&lt;10%)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">PRD (Regressivity)</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1.02</div>
              <p className="text-xs text-muted-foreground flex items-center mt-1">
                <CheckCircle2 className="w-3 h-3 text-green-500 mr-1" />
                No regressivity detected
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">PRB (Progressivity)</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0.98</div>
              <p className="text-xs text-muted-foreground flex items-center mt-1">
                <CheckCircle2 className="w-3 h-3 text-green-500 mr-1" />
                No progressivity detected
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Ratio Studies</CardTitle>
              <CardDescription>
                Statistical measures that prove model accuracy and uniformity across the jurisdiction
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Assessment Ratio (A/S)</h4>
                <p className="text-sm text-muted-foreground">
                  Measures the relationship between assessed values and sale prices. Target range: 0.90 - 1.10 (IAAO standards).
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Coefficient of Dispersion (COD)</h4>
                <p className="text-sm text-muted-foreground">
                  Measures uniformity of assessments. Lower is better. Target: &lt;10% for residential, &lt;15% for commercial.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Price-Related Differential (PRD)</h4>
                <p className="text-sm text-muted-foreground">
                  Detects regressivity (over-assessing low-value properties). Target: 0.98 - 1.03.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Price-Related Bias (PRB)</h4>
                <p className="text-sm text-muted-foreground">
                  Detects progressivity (over-assessing high-value properties). Target: -0.05 to +0.05.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quality Assurance Checks</CardTitle>
              <CardDescription>
                Automated validation to ensure model integrity and prevent sales chasing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Holdout Validation</h4>
                <p className="text-sm text-muted-foreground">
                  Test model performance on sales not used in calibration to detect overfitting.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Drift Detection</h4>
                <p className="text-sm text-muted-foreground">
                  Monitor model performance over time to identify when recalibration is needed.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Neighborhood Stratification</h4>
                <p className="text-sm text-muted-foreground">
                  Analyze ratio statistics by neighborhood to identify localized issues.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Sales Chasing Detection</h4>
                <p className="text-sm text-muted-foreground">
                  Flag properties where assessed value suspiciously tracks recent sale price.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coming Soon Notice */}
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <CardTitle>Feature In Development</CardTitle>
            </div>
            <CardDescription>
              Full ratio study tools, interactive charts, and automated QA reporting are coming soon.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              This module will provide comprehensive statistical analysis tools to validate model performance, 
              detect bias, and generate defensible reports for appeals and audits.
            </p>
            <Button variant="outline" disabled>
              Run Ratio Study
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
