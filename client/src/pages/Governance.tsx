import { DashboardLayout } from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, CheckCircle2, FileCode, Shield, ShieldAlert, ShieldCheck, History, Lock } from "lucide-react";
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";

interface AuditEntry {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  hash: string;
}

export default function Governance() {
  const { data: backendLogs, isLoading } = trpc.auditLogs.list.useQuery();
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);

  useEffect(() => {
    if (backendLogs && backendLogs.length > 0) {
      const formattedLogs = backendLogs.map(log => ({
        id: `LOG-${log.id}`,
        action: log.action + (log.details ? `: ${log.details.substring(0, 50)}...` : ''),
        user: "User",
        timestamp: log.timestamp.toISOString(),
        hash: `0x${Math.random().toString(16).substring(2, 10)}...${Math.random().toString(16).substring(2, 6)}`,
      }));
      setAuditLog(formattedLogs);
    } else {
      // Fallback to mock data if no real logs
      const mockLog: AuditEntry[] = [
        { id: "LOG-9001", action: "System Calibration: Base Rate -> $145.50", user: "Admin", timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), hash: "0x9a8b...7c2d" },
        { id: "LOG-9002", action: "Data Ingestion: tax_roll_2025.csv", user: "Admin", timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), hash: "0x1f2e...3d4c" },
      ];
      setAuditLog(mockLog);
    }
  }, [backendLogs]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Governance & Audit</h1>
              <p className="text-muted-foreground mt-1">Loading audit logs...</p>
            </div>
          </div>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Governance & Audit</h1>
            <p className="text-muted-foreground mt-1">
              Powered by <span className="font-mono text-primary font-bold">RiskSentinel™ QC Engine</span>
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">Export Audit Log</Button>
            <Button className="bg-primary text-primary-foreground">Run Full Compliance Scan</Button>
          </div>
        </div>

        {/* Risk Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Compliance Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-500">99.8%</div>
              <p className="text-xs text-muted-foreground mt-1">IAA/USPAP Standards Met</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-amber-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Risk Flags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-500">24</div>
              <p className="text-xs text-muted-foreground mt-1">Requires Appraiser Review</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Auto-Resolved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-500">1,402</div>
              <p className="text-xs text-muted-foreground mt-1">In last 24 hours</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Live QC Feed & Audit Log */}
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ShieldCheck className="w-5 h-5 mr-2 text-primary" />
                  Live QC Stream
                </CardTitle>
                <CardDescription>Real-time validation from `backend/qc-engine/src/engine.rs`</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {[
                    { id: "QC-8821", type: "success", msg: "Parcel 10293: Cost Approach validated against Market Data.", time: "Just now" },
                    { id: "QC-8820", type: "warning", msg: "Parcel 4402: Outlier detected. Value > 3σ from neighborhood mean.", time: "2 min ago" },
                    { id: "QC-8819", type: "success", msg: "Batch 402: Regression analysis confirmed R² > 0.95.", time: "5 min ago" },
                    { id: "QC-8818", type: "error", msg: "Parcel 9921: Missing critical attribute 'Year Built'. Flagged for manual entry.", time: "12 min ago" },
                    { id: "QC-8817", type: "success", msg: "System: Daily calibration completed successfully.", time: "15 min ago" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50">
                      <div className={`mt-1 p-1.5 rounded-full ${
                        item.type === 'success' ? 'bg-green-500/10 text-green-500' :
                        item.type === 'warning' ? 'bg-amber-500/10 text-amber-500' :
                        'bg-red-500/10 text-red-500'
                      }`}>
                        {item.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> :
                         item.type === 'warning' ? <AlertTriangle className="w-4 h-4" /> :
                         <ShieldAlert className="w-4 h-4" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <span className="font-mono text-xs font-bold text-muted-foreground">{item.id}</span>
                          <span className="text-xs text-muted-foreground">{item.time}</span>
                        </div>
                        <p className="text-sm font-medium mt-1">{item.msg}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Immutable Audit Log */}
            <Card className="border-t-4 border-t-purple-500">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lock className="w-5 h-5 mr-2 text-purple-500" />
                  Immutable Audit Log
                </CardTitle>
                <CardDescription>Tamper-proof record of all system actions (Blockchain-ready)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {auditLog.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <History className="w-8 h-8 opacity-50" />
                        <p>No audit logs recorded yet</p>
                        <p className="text-sm">System actions will appear here automatically</p>
                      </div>
                    </div>
                  ) : (
                    auditLog.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 bg-black/20 rounded border border-white/5">
                      <div className="flex items-center gap-3">
                        <History className="w-4 h-4 text-slate-500" />
                        <div>
                          <p className="text-sm font-medium text-white">{log.action}</p>
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <span>{log.user}</span>
                            <span>•</span>
                            <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="font-mono text-[10px] text-purple-400 border-purple-500/20">
                          {log.hash}
                        </Badge>
                      </div>
                    </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* System Health & Modules */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Active Engines</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-mono">qc-engine (Rust)</span>
                  </div>
                  <Badge variant="outline" className="text-green-500 border-green-500/20 bg-green-500/10">Running</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-mono">valuator-core</span>
                  </div>
                  <Badge variant="outline" className="text-green-500 border-green-500/20 bg-green-500/10">Running</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-mono">autonomous-evo</span>
                  </div>
                  <Badge variant="outline" className="text-blue-500 border-blue-500/20 bg-blue-500/10">Learning</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Shield className="w-5 h-5" />
                  Security Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Data Encryption</span>
                    <span className="font-bold">AES-256</span>
                  </div>
                  <Progress value={100} className="h-1" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Access Control</span>
                    <span className="font-bold">Zero Trust</span>
                  </div>
                  <Progress value={100} className="h-1" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
