import { DashboardLayout } from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, BarChart3, CheckCircle2, Factory, Layers, Play, Zap, Search, Home } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function MassValuationStudio() {
  const [subjectParcel, setSubjectParcel] = useState("");
  const [comps, setComps] = useState<any[]>([]);

  const findComps = () => {
    // Simulate finding comps
    const mockComps = [
      { id: "10294", address: "124 Maple St", sqft: 2400, year: 2015, dist: "0.1 mi", price: 450000, score: 98 },
      { id: "10301", address: "128 Maple St", sqft: 2350, year: 2014, dist: "0.2 mi", price: 445000, score: 95 },
      { id: "10455", address: "45 Oak Ave", sqft: 2500, year: 2016, dist: "0.4 mi", price: 460000, score: 92 },
      { id: "10112", address: "12 Pine Ln", sqft: 2200, year: 2012, dist: "0.5 mi", price: 425000, score: 88 },
      { id: "10567", address: "88 Elm Dr", sqft: 2600, year: 2018, dist: "0.8 mi", price: 480000, score: 85 },
    ];
    setComps(mockComps);
  };

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
                    <span className="text--[#00ffee]">12%</span>
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

        {/* Automated Comp Finder */}
        <Card className="terra-card">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Home className="w-5 h-5 text-purple-400" />
              Automated Comparable Sales Finder
            </CardTitle>
            <CardDescription>Instantly find the top 5 comparable sales for any subject property.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-4">
              <Input 
                placeholder="Enter Subject Parcel ID (e.g., 10293)" 
                className="bg-black/20 border-white/10"
                value={subjectParcel}
                onChange={(e) => setSubjectParcel(e.target.value)}
              />
              <Button className="bg-purple-500 hover:bg-purple-600 text-white" onClick={findComps}>
                <Search className="w-4 h-4 mr-2" />
                Find Comps
              </Button>
            </div>

            {comps.length > 0 && (
              <div className="rounded-md border border-white/10 overflow-hidden">
                <Table>
                  <TableHeader className="bg-white/5">
                    <TableRow>
                      <TableHead className="text-slate-400">Parcel ID</TableHead>
                      <TableHead className="text-slate-400">Address</TableHead>
                      <TableHead className="text-slate-400">Sq. Ft.</TableHead>
                      <TableHead className="text-slate-400">Year Built</TableHead>
                      <TableHead className="text-slate-400">Distance</TableHead>
                      <TableHead className="text-right text-slate-400">Sale Price</TableHead>
                      <TableHead className="text-right text-slate-400">Similarity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {comps.map((comp) => (
                      <TableRow key={comp.id} className="hover:bg-white/5">
                        <TableCell className="font-mono text-white">{comp.id}</TableCell>
                        <TableCell className="text-slate-300">{comp.address}</TableCell>
                        <TableCell className="text-slate-300">{comp.sqft}</TableCell>
                        <TableCell className="text-slate-300">{comp.year}</TableCell>
                        <TableCell className="text-slate-300">{comp.dist}</TableCell>
                        <TableCell className="text-right font-mono text-[#00ffee]">${comp.price.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className={`
                            ${comp.score >= 95 ? 'text-green-400 border-green-500/30 bg-green-500/10' : 
                              comp.score >= 90 ? 'text-blue-400 border-blue-500/30 bg-blue-500/10' : 
                              'text-amber-400 border-amber-500/30 bg-amber-500/10'}
                          `}>
                            {comp.score}% Match
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
