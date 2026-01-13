import { DashboardLayout } from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, BarChart3, CheckCircle2, Factory, Layers, Play, Zap } from "lucide-react";

export default function MassValuationStudio() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <Factory className="w-8 h-8 text-[#00ffee]" />
              Mass Valuation Studio
            </h1>
            <p className="text-slate-400 mt-1">
              The "Factory". Execute massive scale valuations with Rust Core speed.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-[#00ffee]/10 text-[#00ffee] border-[#00ffee]/20 px-3 py-1">
              <Zap className="w-3 h-3 mr-1 animate-pulse" />
              Batch Processor Agent Active
            </Badge>
            <Button className="bg-[#00ffee] text-[#0b1020] hover:bg-[#00ffee]/90 font-bold active-recoil shadow-[0_0_20px_rgba(0,255,238,0.3)]">
              <Play className="w-4 h-4 mr-2 fill-current" />
              Run Full County Reval
            </Button>
          </div>
        </div>

        {/* Shadow Valuation Scenarios */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 terra-card">
            <CardHeader>
              <CardTitle className="text-[#00ffee] flex items-center gap-2">
                <Layers className="w-5 h-5" />
                Shadow Valuation Scenarios
              </CardTitle>
              <CardDescription>
                The AI has pre-calculated 3 scenarios overnight. Choose the best fit.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { 
                  name: "Scenario A: Conservative 2026", 
                  desc: "Standard Cost Approach + 1.5% Land", 
                  stats: { prd: "1.04", cod: "9.2%", change: "+4.5%" },
                  status: "warning"
                },
                { 
                  name: "Scenario B: Market Aggressive", 
                  desc: "Market Modified Cost + 5% Land", 
                  stats: { prd: "0.97", cod: "11.5%", change: "+12.8%" },
                  status: "danger"
                },
                { 
                  name: "Scenario C: Balanced Harmony", 
                  desc: "Hybrid Model (Cost + Income Weighting)", 
                  stats: { prd: "1.01", cod: "6.8%", change: "+7.2%" },
                  status: "success",
                  recommended: true
                },
              ].map((scenario, i) => (
                <div key={i} className={`relative flex flex-col md:flex-row items-start md:items-center justify-between p-6 rounded-xl border transition-all duration-300 ${scenario.recommended ? 'bg-[#00ffee]/5 border-[#00ffee] shadow-[0_0_15px_rgba(0,255,238,0.1)]' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
                  {scenario.recommended && (
                    <div className="absolute -top-3 left-6 bg-[#00ffee] text-[#0b1020] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      AI Recommended
                    </div>
                  )}
                  <div className="mb-4 md:mb-0">
                    <h4 className={`font-bold text-lg ${scenario.recommended ? 'text-[#00ffee]' : 'text-white'}`}>{scenario.name}</h4>
                    <p className="text-sm text-slate-400">{scenario.desc}</p>
                  </div>
                  
                  <div className="flex items-center gap-8">
                    <div className="flex gap-6 text-sm">
                      <div className="text-center">
                        <div className="text-slate-500 text-[10px] uppercase">PRD</div>
                        <div className={`font-mono font-bold ${scenario.stats.prd === '1.01' ? 'text-green-400' : 'text-yellow-400'}`}>{scenario.stats.prd}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-slate-500 text-[10px] uppercase">COD</div>
                        <div className="font-mono font-bold text-white">{scenario.stats.cod}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-slate-500 text-[10px] uppercase">Total Val</div>
                        <div className="font-mono font-bold text-[#00ffee]">{scenario.stats.change}</div>
                      </div>
                    </div>
                    
                    <Button 
                      className={`${scenario.recommended ? 'bg-[#00ffee] text-[#0b1020] hover:bg-[#00ffee]/90' : 'bg-white/10 text-white hover:bg-white/20'} font-bold active-recoil`}
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Batch Processor Status */}
          <Card className="terra-card bg-gradient-to-b from-[#0b1020] to-[#050810]">
            <CardHeader>
              <CardTitle className="text-white">Rust Core Engine</CardTitle>
              <CardDescription>Real-time processing metrics.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="text-center py-4">
                <div className="text-5xl font-mono font-bold text-[#00ffee] drop-shadow-[0_0_10px_rgba(0,255,238,0.5)]">
                  50,000
                </div>
                <div className="text-xs text-slate-400 uppercase tracking-widest mt-2">Parcels / 3.2 Seconds</div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs uppercase tracking-wider text-slate-500">
                    <span>CPU Load (WASM)</span>
                    <span className="text-[#00ffee]">12%</span>
                  </div>
                  <Progress value={12} className="h-1 bg-white/10 [&>div]:bg-[#00ffee]" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-xs uppercase tracking-wider text-slate-500">
                    <span>Memory Usage</span>
                    <span className="text-purple-400">48MB</span>
                  </div>
                  <Progress value={4} className="h-1 bg-white/10 [&>div]:bg-purple-400" />
                </div>
              </div>

              <div className="p-4 rounded-lg bg-[#00ffee]/5 border border-[#00ffee]/20">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#00ffee] mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-white">System Ready</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      The Rust Core is primed. "Shadow Valuation" complete. Ready to commit to production database.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
