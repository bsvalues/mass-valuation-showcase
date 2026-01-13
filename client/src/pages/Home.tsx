import { DashboardLayout } from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowUpRight, BarChart, CheckCircle2, Clock, FileText, TrendingUp, Users, Zap } from "lucide-react";

export default function Home() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-2xl">
          <div className="absolute inset-0 bg-[url('/images/hero-quantum-valuation.jpg')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
          <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-4 max-w-2xl">
              <Badge variant="outline" className="bg-primary-foreground/10 text-primary-foreground border-primary-foreground/20 backdrop-blur-sm">
                TerraFusion Elite OS v2.0
              </Badge>
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight">
                Mass Valuation <br />
                <span className="text-sidebar-primary">Quantum Intelligence</span>
              </h1>
              <p className="text-primary-foreground/80 text-lg max-w-xl">
                Discover hidden harmonies in property data with the world's first 3-6-9 quantum-powered appraisal suite.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <Button size="lg" className="bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 border-0">
                  Run Calibration
                </Button>
                <Button size="lg" variant="outline" className="bg-transparent text-primary-foreground border-primary-foreground/30 hover:bg-primary-foreground/10">
                  View Documentation
                </Button>
              </div>
            </div>
            
            {/* Live Status Card */}
            <div className="bg-background/10 backdrop-blur-md border border-primary-foreground/10 rounded-xl p-6 w-full md:w-80 shadow-xl">
              <h3 className="text-sm font-medium text-primary-foreground/70 uppercase tracking-wider mb-4">System Health</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">QVE Model Accuracy</span>
                  <span className="text-sm font-bold text-sidebar-primary">98.4%</span>
                </div>
                <Progress value={98} className="h-1.5 bg-primary-foreground/10" />
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Data Integrity</span>
                  <span className="text-sm font-bold text-sidebar-primary">100%</span>
                </div>
                <Progress value={100} className="h-1.5 bg-primary-foreground/10" />
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Processing Load</span>
                  <span className="text-sm font-bold text-sidebar-primary">12%</span>
                </div>
                <Progress value={12} className="h-1.5 bg-primary-foreground/10" />
              </div>
            </div>
          </div>
        </div>

        {/* 3-6-9 Framework Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-t-4 border-t-chart-1 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="w-12 h-12 rounded-lg bg-chart-1/10 flex items-center justify-center mb-4">
                <img src="/images/icon-foundation.png" alt="Foundation" className="w-8 h-8 object-contain" />
              </div>
              <CardTitle className="text-xl">Level 3: Foundation</CardTitle>
              <CardDescription>Stability & Security</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                PhD-level authentication and rigorous statistical baselines ensure a rock-solid platform for valuation.
              </p>
              <div className="flex items-center text-sm font-medium text-chart-1">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Perfect Balance Score: 12.0
              </div>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-chart-2 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="w-12 h-12 rounded-lg bg-chart-2/10 flex items-center justify-center mb-4">
                <img src="/images/icon-amplification.png" alt="Amplification" className="w-8 h-8 object-contain" />
              </div>
              <CardTitle className="text-xl">Level 6: Amplification</CardTitle>
              <CardDescription>Synergy & Insight</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Combining multiple data streams to discover hidden market drivers and amplify valuation accuracy.
              </p>
              <div className="flex items-center text-sm font-medium text-chart-2">
                <TrendingUp className="w-4 h-4 mr-2" />
                Synergy Factor: 666
              </div>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-chart-3 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="w-12 h-12 rounded-lg bg-chart-3/10 flex items-center justify-center mb-4">
                <img src="/images/icon-ultimate-power.png" alt="Ultimate Power" className="w-8 h-8 object-contain" />
              </div>
              <CardTitle className="text-xl">Level 9: Ultimate Power</CardTitle>
              <CardDescription>Global Normalization</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Achieving total market equilibrium and fairness through advanced quantum AI processing.
              </p>
              <div className="flex items-center text-sm font-medium text-chart-3">
                <Zap className="w-4 h-4 mr-2" />
                Power Level: Maximum
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList className="bg-muted/50 p-1">
              <TabsTrigger value="overview">Market Overview</TabsTrigger>
              <TabsTrigger value="equity">Equity Analysis</TabsTrigger>
              <TabsTrigger value="appeals">Appeals Tracking</TabsTrigger>
            </TabsList>
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="w-4 h-4 mr-2" />
              Last updated: Just now
            </div>
          </div>

          <TabsContent value="overview" className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Assessed Value</CardTitle>
                  <span className="text-muted-foreground font-mono text-xs">USD</span>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$42.8B</div>
                  <p className="text-xs text-muted-foreground flex items-center mt-1">
                    <ArrowUpRight className="w-3 h-3 text-green-500 mr-1" />
                    <span className="text-green-500 font-medium">+4.2%</span> from last year
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Median Ratio (A/S)</CardTitle>
                  <BarChart className="h-4 w-4 text-muted-foreground" />
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
                  <CardTitle className="text-sm font-medium">Active Appeals</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">142</div>
                  <p className="text-xs text-muted-foreground flex items-center mt-1">
                    <span className="text-amber-500 font-medium">-12%</span> vs same time last year
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Main Chart Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Valuation Trends by Neighborhood</CardTitle>
                  <CardDescription>Comparative analysis of median value changes over the last 5 years.</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center bg-muted/10 rounded-md border border-dashed border-muted">
                  <div className="text-center text-muted-foreground">
                    <BarChart className="w-12 h-12 mx-auto mb-2 opacity-20" />
                    <p>Interactive Chart Component Placeholder</p>
                    <p className="text-xs">(Will be implemented with Recharts)</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest system actions and alerts.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { title: "Model Calibration Complete", time: "2 hours ago", type: "success" },
                      { title: "New Sales Data Ingested", time: "5 hours ago", type: "info" },
                      { title: "PRD Alert: Sector 7G", time: "1 day ago", type: "warning" },
                      { title: "Weekly Backup Verified", time: "1 day ago", type: "success" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start pb-4 border-b border-border last:border-0 last:pb-0">
                        <div className={`w-2 h-2 mt-1.5 rounded-full mr-3 ${
                          item.type === 'success' ? 'bg-green-500' : 
                          item.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                        }`} />
                        <div>
                          <p className="text-sm font-medium">{item.title}</p>
                          <p className="text-xs text-muted-foreground">{item.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
