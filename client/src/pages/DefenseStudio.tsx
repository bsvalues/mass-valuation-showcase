import { DashboardLayout } from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, FileText, Gavel, Scale, Shield, ShieldCheck, Zap } from "lucide-react";
import { generateDefensePacket } from "@/lib/pdfGenerator";
import { toast } from "sonner";

export default function DefenseStudio() {
  const handleDownload = (id: string) => {
    toast.promise(
      new Promise((resolve) => {
        setTimeout(() => {
          generateDefensePacket({
            id: id,
            address: "12405 NW 23rd Ave",
            owner: "Smith, John",
            issue: "Patio Valuation Dispute",
            assessedValue: 4800,
            comparables: [
              { address: "12401 NW 23rd Ave", value: 5000, diff: 4.2 },
              { address: "12409 NW 23rd Ave", value: 4600, diff: -4.1 },
              { address: "12398 NW 22nd St", value: 4900, diff: 2.1 },
              { address: "12410 NW 22nd St", value: 4750, diff: -1.0 },
            ]
          });
          resolve(true);
        }, 1500);
      }),
      {
        loading: 'Compiling Defense Dossier...',
        success: 'Packet Downloaded Successfully',
        error: 'Failed to generate packet'
      }
    );
  };
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <Shield className="w-8 h-8 text-[#00ffee]" />
              Defense Studio
            </h1>
            <p className="text-slate-400 mt-1">
              The "Shield". Defend values with AI-generated evidence dossiers.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-[#00ffee]/10 text-[#00ffee] border-[#00ffee]/20 px-3 py-1">
              <Zap className="w-3 h-3 mr-1 animate-pulse" />
              Legal Defense Agent Active
            </Badge>
            <Button className="bg-[#00ffee] text-[#0b1020] hover:bg-[#00ffee]/90 font-bold active-recoil shadow-[0_0_20px_rgba(0,255,238,0.3)]">
              <Gavel className="w-4 h-4 mr-2" />
              Prepare Hearing Docket
            </Button>
          </div>
        </div>

        {/* Active Appeals */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 terra-card">
            <CardHeader>
              <CardTitle className="text-[#00ffee] flex items-center gap-2">
                <Scale className="w-5 h-5" />
                Active Appeals Queue
              </CardTitle>
              <CardDescription>
                The AI has automatically generated defense packets for 12 active appeals.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { 
                  id: "AP-2026-042",
                  address: "12405 NW 23rd Ave",
                  owner: "Smith, John",
                  issue: "Patio Valuation Dispute",
                  status: "ready",
                  confidence: "99.8%"
                },
                { 
                  id: "AP-2026-045",
                  address: "8802 NE 12th St",
                  owner: "Johnson LLC",
                  issue: "Grade/Condition Mismatch",
                  status: "ready",
                  confidence: "96.5%"
                },
                { 
                  id: "AP-2026-048",
                  address: "4500 Main St",
                  owner: "Downtown Corp",
                  issue: "Income Cap Rate",
                  status: "processing",
                  confidence: "Calculating..."
                },
              ].map((appeal, i) => (
                <div key={i} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${appeal.status === 'ready' ? 'bg-[#00ffee]/10 text-[#00ffee]' : 'bg-amber-500/10 text-amber-500'}`}>
                      {appeal.status === 'ready' ? <ShieldCheck className="w-5 h-5" /> : <Zap className="w-5 h-5 animate-pulse" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-white flex items-center gap-2">
                        {appeal.address}
                        <span className="text-xs font-normal text-slate-500 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">{appeal.id}</span>
                      </h4>
                      <p className="text-sm text-slate-400">{appeal.issue} • {appeal.owner}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 mt-4 md:mt-0 w-full md:w-auto justify-between md:justify-end">
                    {appeal.status === 'ready' && (
                      <div className="text-right">
                        <div className="text-[10px] uppercase text-slate-500">Win Probability</div>
                        <div className="font-mono font-bold text-[#00ffee]">{appeal.confidence}</div>
                      </div>
                    )}
                    
                    <Button 
                      size="sm" 
                      className={`${appeal.status === 'ready' ? 'bg-[#00ffee] text-[#0b1020] hover:bg-[#00ffee]/90' : 'bg-white/10 text-slate-400 cursor-not-allowed'} font-bold active-recoil`}
                      disabled={appeal.status !== 'ready'}
                      onClick={() => handleDownload(appeal.id)}
                    >
                      {appeal.status === 'ready' ? (
                        <>
                          <FileText className="w-4 h-4 mr-2" />
                          Download Packet
                        </>
                      ) : (
                        "Generating..."
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* The Patio Defense Demo */}
          <Card className="terra-card border-l-4 border-l-[#00ffee]">
            <CardHeader>
              <CardTitle className="text-white">"The Patio Defense"</CardTitle>
              <CardDescription>Automated equity evidence generation.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 rounded-lg bg-[#00ffee]/5 border border-[#00ffee]/20">
                <h4 className="text-sm font-bold text-[#00ffee] mb-2">Subject Property</h4>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">Patio Size</span>
                  <span className="text-white">400 sq ft</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Assessed Value</span>
                  <span className="text-white">$4,800 ($12/sf)</span>
                </div>
              </div>

              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-0.5 h-full bg-gradient-to-b from-transparent via-[#00ffee]/50 to-transparent" />
                </div>
                <div className="relative z-10 bg-[#0b1020] px-4 py-1 text-center text-xs text-[#00ffee] border border-[#00ffee]/30 rounded-full w-max mx-auto">
                  AI Comparison vs. 50 Peers
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Median Peer Value</span>
                  <span className="text-white font-mono">$12.50/sf</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Deviation</span>
                  <span className="text-green-400 font-mono">-4.0% (Defensible)</span>
                </div>
                <Progress value={96} className="h-2 bg-white/10 [&>div]:bg-green-500" />
                <p className="text-xs text-slate-500 mt-2">
                  Conclusion: Subject property is assessed <span className="text-white font-bold">below</span> the median of 50 comparable patios. Appeal should be denied.
                </p>
              </div>

              <Button 
                className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10 active-recoil"
                onClick={() => handleDownload("AP-2026-042")}
              >
                Download PDF Dossier
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
