import { DashboardLayout } from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, ArrowRight, CheckCircle2, LineChart, RefreshCw, Sliders, Zap } from "lucide-react";

export default function CalibrationStudio() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <Sliders className="w-8 h-8 text-[#00ffee]" />
              Calibration Studio
            </h1>
            <p className="text-slate-400 mt-1">
              The "Truth" Engine. Tune the math to the market with auto-harmonization.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-[#00ffee]/10 text-[#00ffee] border-[#00ffee]/20 px-3 py-1">
              <Zap className="w-3 h-3 mr-1 animate-pulse" />
              Market Analyst Agent Active
            </Badge>
            <Button className="bg-[#00ffee] text-[#0b1020] hover:bg-[#00ffee]/90 font-bold active-recoil">
              <RefreshCw className="w-4 h-4 mr-2" />
              Run Auto-Harmonization
            </Button>
          </div>
        </div>

        {/* Drift Alerts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 terra-card border-l-4 border-l-amber-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-500">
                <AlertTriangle className="w-5 h-5" />
                Market Drift Detected
              </CardTitle>
              <CardDescription>
                The AI Agent has identified 3 neighborhoods where assessed values are drifting from market sales.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { name: "Neighborhood 4 (Richland)", ratio: 0.88, drift: "-12%", recommendation: "+2% Land Factor" },
                { name: "Sector 7G (Industrial)", ratio: 0.91, drift: "-9%", recommendation: "+5% Cost Table" },
                { name: "Riverfront Estates", ratio: 1.08, drift: "+8%", recommendation: "-3% Quality Adj" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                  <div>
                    <h4 className="font-medium text-white">{item.name}</h4>
                    <div className="flex items-center gap-4 mt-1 text-sm text-slate-400">
                      <span className="flex items-center gap-1">
                        <LineChart className="w-3 h-3" /> Ratio: <span className={item.ratio < 0.9 ? "text-red-400" : "text-green-400"}>{item.ratio}</span>
                      </span>
                      <span>Drift: {item.drift}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <span className="text-xs text-slate-500 uppercase tracking-wider">AI Recommendation</span>
                      <p className="text-[#00ffee] font-mono font-bold">{item.recommendation}</p>
                    </div>
                    <Button size="sm" variant="outline" className="border-[#00ffee]/30 text-[#00ffee] hover:bg-[#00ffee]/10 active-recoil">
                      Review
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Calibration Health */}
          <Card className="terra-card">
            <CardHeader>
              <CardTitle className="text-[#00ffee]">System Calibration</CardTitle>
              <CardDescription>Overall model accuracy metrics.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Median Sales Ratio</span>
                  <span className="text-white font-mono">0.96</span>
                </div>
                <Progress value={96} className="h-2 bg-white/10 [&>div]:bg-green-500" />
                <p className="text-xs text-green-500 flex items-center">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Within target (0.90 - 1.10)
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">COD (Uniformity)</span>
                  <span className="text-white font-mono">8.4%</span>
                </div>
                <Progress value={84} className="h-2 bg-white/10 [&>div]:bg-[#00ffee]" />
                <p className="text-xs text-[#00ffee] flex items-center">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Excellent (&lt; 10%)
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">PRD (Vertical Equity)</span>
                  <span className="text-white font-mono">1.01</span>
                </div>
                <Progress value={99} className="h-2 bg-white/10 [&>div]:bg-purple-500" />
                <p className="text-xs text-purple-500 flex items-center">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Perfect Balance (0.98 - 1.03)
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Calibration Controls */}
        <Tabs defaultValue="cost" className="w-full">
          <TabsList className="bg-white/5 border border-white/10 p-1">
            <TabsTrigger value="cost">Cost Tables</TabsTrigger>
            <TabsTrigger value="land">Land Models</TabsTrigger>
            <TabsTrigger value="depreciation">Depreciation</TabsTrigger>
            <TabsTrigger value="modifiers">Neighborhood Modifiers</TabsTrigger>
          </TabsList>
          <TabsContent value="cost" className="mt-6">
            <Card className="terra-card">
              <CardHeader>
                <CardTitle>Base Cost Calibration</CardTitle>
                <CardDescription>Adjust base rates for construction types based on local market indices.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center border border-dashed border-white/10 rounded-lg bg-black/20">
                  <p className="text-slate-500">Interactive Cost Curve Editor Placeholder</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
