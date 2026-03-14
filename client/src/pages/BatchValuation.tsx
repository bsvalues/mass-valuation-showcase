import { useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Play, X, Download, AlertTriangle, CheckCircle2, Clock, Cpu, BarChart2, RefreshCw, Trash2, ChevronRight, FileText } from "lucide-react";

function getStatusBadge(status: string) {
  switch (status) {
    case "completed": return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Completed</Badge>;
    case "processing": return <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 animate-pulse">Processing</Badge>;
    case "pending":    return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Pending</Badge>;
    case "failed":     return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Failed</Badge>;
    case "cancelled":  return <Badge variant="secondary">Cancelled</Badge>;
    default:           return <Badge variant="outline">{status}</Badge>;
  }
}

function formatCurrency(v: number | null | undefined) {
  if (v == null) return "\u2014";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);
}

interface ResultRow { parcelId: string; predictedValue: number | null; currentValue: number | null; modelType: string | null; }

function exportResultsCSV(results: ResultRow[], jobName: string) {
  const header = "Parcel ID,Predicted Value,Current Value,Variance ($),Variance (%),Model Type\n";
  const rows = results.map((r) => {
    const variance = r.predictedValue != null && r.currentValue != null ? r.predictedValue - r.currentValue : null;
    const variancePct = variance != null && r.currentValue ? ((variance / r.currentValue) * 100).toFixed(2) : "";
    return [r.parcelId, r.predictedValue?.toFixed(2) ?? "", r.currentValue?.toFixed(2) ?? "", variance?.toFixed(2) ?? "", variancePct, r.modelType ?? ""].join(",");
  });
  const csv = header + rows.join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `batch-results-${jobName.replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function BatchValuation() {
  const [batchName, setBatchName] = useState("");
  const [parcelIds, setParcelIds] = useState("");
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);

  const { data: productionModel, isLoading: modelLoading } = trpc.batchValuation.getProductionModelInfo.useQuery();
  const { data: batchJobsList, refetch: refetchJobs } = trpc.batchValuation.listJobs.useQuery({ limit: 20 });
  const { data: jobResults, isLoading: resultsLoading } = trpc.batchValuation.getJobResults.useQuery(
    { jobId: selectedJobId!, limit: 200, offset: 0 },
    { enabled: selectedJobId != null }
  );

  const startBatchMutation = trpc.batchValuation.startJob.useMutation({
    onSuccess: (data) => {
      toast.success(`Batch job "${batchName}" started`, {
        description: `Processing ${data.totalParcels} parcel${data.totalParcels !== 1 ? "s" : ""} with ${productionModel ? "production regression model" : "mock AVM"}.`,
      });
      setBatchName(""); setParcelIds(""); refetchJobs();
    },
    onError: (err) => toast.error("Failed to start batch job", { description: err.message }),
  });

  const cancelBatchMutation = trpc.batchValuation.cancelJob.useMutation({
    onSuccess: () => { toast.success("Batch job cancelled"); refetchJobs(); },
    onError: () => toast.error("Failed to cancel batch job"),
  });

  const deleteJobMutation = trpc.batchValuation.deleteJob.useMutation({
    onSuccess: () => { toast.success("Job deleted"); if (selectedJobId != null) setSelectedJobId(null); refetchJobs(); },
    onError: () => toast.error("Failed to delete job"),
  });

  const pollJobs = useCallback(() => {
    if (!batchJobsList) return;
    if (batchJobsList.some((j) => j.status === "processing" || j.status === "pending")) refetchJobs();
  }, [batchJobsList, refetchJobs]);

  useEffect(() => {
    const hasActive = batchJobsList?.some((j) => j.status === "processing" || j.status === "pending");
    if (!hasActive) return;
    const interval = setInterval(pollJobs, 2000);
    return () => clearInterval(interval);
  }, [batchJobsList, pollJobs]);

  const handleStartBatch = () => {
    if (!batchName.trim()) { toast.error("Please enter a batch name"); return; }
    if (!parcelIds.trim()) { toast.error("Please enter parcel IDs"); return; }
    const ids = parcelIds.split(/[,\n]/).map((id) => id.trim()).filter(Boolean);
    if (ids.length === 0) { toast.error("No valid parcel IDs found"); return; }
    startBatchMutation.mutate({ name: batchName, parcelIds: ids });
  };

  const parsedCount = parcelIds.split(/[,\n]/).filter((id) => id.trim()).length;

  const resultRows: ResultRow[] = (jobResults ?? []).map((r) => {
    let currentValue: number | null = null;
    try { const f = JSON.parse(r.features ?? "{}"); currentValue = f.totalValue ?? f.buildingValue ?? null; } catch { /* ignore */ }
    return { parcelId: r.parcelId, predictedValue: r.predictedValue, currentValue, modelType: r.modelType };
  });

  const selectedJob = batchJobsList?.find((j) => j.id === selectedJobId);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Batch Valuation Processing</h1>
          <p className="text-muted-foreground mt-1">Run mass appraisal inference on thousands of parcels simultaneously using your production regression model.</p>
        </div>

        {modelLoading ? (
          <Skeleton className="h-16 w-full rounded-lg" />
        ) : productionModel ? (
          <div className="flex items-center gap-4 p-4 rounded-lg border border-cyan-500/30 bg-cyan-500/5">
            <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-cyan-300">Production Model Active: <span className="font-bold">{productionModel.name}</span></p>
              <p className="text-xs text-muted-foreground mt-0.5">{productionModel.variables.length} variables &middot; R&sup2; = {productionModel.rSquared.toFixed(4)} &middot; Dependent: <span className="font-mono">{productionModel.dependentVariable}</span></p>
            </div>
            <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 shrink-0"><Cpu className="w-3 h-3 mr-1" /> Linear Regression</Badge>
          </div>
        ) : (
          <div className="flex items-start gap-4 p-4 rounded-lg border border-amber-500/30 bg-amber-500/5">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-300">No Production Model Set</p>
              <p className="text-xs text-muted-foreground mt-0.5">Batch jobs will use the mock AVM estimator. To use real regression coefficients, run a regression in Regression Studio and promote the model to production.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Start New Batch Job</CardTitle>
                <CardDescription>Enter parcel IDs to run batch valuations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="batchName">Batch Name</Label>
                  <Input id="batchName" placeholder="e.g., Q1 2026 Revaluation" value={batchName} onChange={(e) => setBatchName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="parcelIds">Parcel IDs</Label>
                  <textarea id="parcelIds" className="w-full min-h-[100px] p-3 text-sm border rounded-md bg-background resize-y" placeholder="Comma or newline separated" value={parcelIds} onChange={(e) => setParcelIds(e.target.value)} />
                  <p className="text-xs text-muted-foreground">{parsedCount > 0 ? `${parsedCount} parcel${parsedCount !== 1 ? "s" : ""} entered` : "No parcels entered"}</p>
                </div>
                <Button onClick={handleStartBatch} disabled={startBatchMutation.isPending || parsedCount === 0 || !batchName.trim()} className="w-full">
                  {startBatchMutation.isPending ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                  Start Batch Processing
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Batch Jobs</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => refetchJobs()}><RefreshCw className="w-3.5 h-3.5" /></Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {!batchJobsList || batchJobsList.length === 0 ? (
                  <div className="px-6 py-8 text-center text-sm text-muted-foreground">No batch jobs yet. Start your first batch above.</div>
                ) : (
                  <div className="divide-y">
                    {batchJobsList.map((job) => (
                      <button key={job.id} onClick={() => setSelectedJobId(job.id === selectedJobId ? null : job.id)} className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors ${selectedJobId === job.id ? "bg-muted/70" : ""}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium truncate max-w-[140px]">{job.name}</span>
                          <div className="flex items-center gap-1">{getStatusBadge(job.status)}<ChevronRight className="w-3.5 h-3.5 text-muted-foreground" /></div>
                        </div>
                        <Progress value={job.progress ?? 0} className="h-1 mb-1" />
                        <p className="text-xs text-muted-foreground">{job.processedParcels}/{job.totalParcels} parcels</p>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            {selectedJob ? (
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{selectedJob.name}</CardTitle>
                      <CardDescription>Created {new Date(selectedJob.createdAt).toLocaleString()}{selectedJob.completedAt ? ` · Completed ${new Date(selectedJob.completedAt).toLocaleString()}` : ""}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(selectedJob.status)}
                      {selectedJob.status === "processing" && <Button variant="outline" size="sm" onClick={() => cancelBatchMutation.mutate({ jobId: selectedJob.id })}><X className="w-4 h-4 mr-1" /> Cancel</Button>}
                      {["completed", "failed", "cancelled"].includes(selectedJob.status) && <Button variant="outline" size="sm" onClick={() => deleteJobMutation.mutate({ jobId: selectedJob.id })}><Trash2 className="w-4 h-4" /></Button>}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Progress</span><span className="font-medium">{selectedJob.progress ?? 0}%</span></div>
                    <Progress value={selectedJob.progress ?? 0} />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{selectedJob.processedParcels} / {selectedJob.totalParcels} parcels</span>
                      <span><span className="text-green-400">✓ {selectedJob.successfulParcels}</span> &middot; <span className="text-red-400">✗ {selectedJob.failedParcels}</span></span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg bg-muted/50 text-center"><p className="text-xs text-muted-foreground mb-1">Total Parcels</p><p className="text-lg font-bold">{selectedJob.totalParcels}</p></div>
                    <div className="p-3 rounded-lg bg-green-500/10 text-center"><p className="text-xs text-muted-foreground mb-1">Successful</p><p className="text-lg font-bold text-green-400">{selectedJob.successfulParcels}</p></div>
                    <div className="p-3 rounded-lg bg-red-500/10 text-center"><p className="text-xs text-muted-foreground mb-1">Failed</p><p className="text-lg font-bold text-red-400">{selectedJob.failedParcels}</p></div>
                  </div>

                  {selectedJob.errorSummary && <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/5"><p className="text-sm font-medium text-red-400 mb-1">Error Summary</p><p className="text-xs text-muted-foreground">{selectedJob.errorSummary}</p></div>}

                  {selectedJob.status === "completed" && (
                    <>
                      <Separator />
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <BarChart2 className="w-4 h-4 text-cyan-400" />
                            <h3 className="text-sm font-semibold">Valuation Results</h3>
                            <Badge variant="outline" className="text-xs">{resultRows.length} rows</Badge>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => exportResultsCSV(resultRows, selectedJob.name)} disabled={resultRows.length === 0}>
                            <Download className="w-3.5 h-3.5 mr-1.5" /> Export CSV
                          </Button>
                        </div>
                        {resultsLoading ? (
                          <div className="space-y-2">{Array.from({length: 5}).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
                        ) : resultRows.length === 0 ? (
                          <div className="text-center py-8 text-sm text-muted-foreground"><FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />No results found for this job.</div>
                        ) : (
                          <div className="overflow-auto max-h-80 rounded-md border">
                            <table className="w-full text-xs">
                              <thead className="bg-muted/50 sticky top-0">
                                <tr>
                                  <th className="text-left px-3 py-2 font-medium">Parcel ID</th>
                                  <th className="text-right px-3 py-2 font-medium">Predicted Value</th>
                                  <th className="text-right px-3 py-2 font-medium">Current Value</th>
                                  <th className="text-right px-3 py-2 font-medium">Variance</th>
                                  <th className="text-left px-3 py-2 font-medium">Model</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y">
                                {resultRows.map((row) => {
                                  const variance = row.predictedValue != null && row.currentValue != null ? row.predictedValue - row.currentValue : null;
                                  const variancePct = variance != null && row.currentValue ? (variance / row.currentValue) * 100 : null;
                                  const isHighVariance = variancePct != null && Math.abs(variancePct) > 20;
                                  return (
                                    <tr key={row.parcelId} className="hover:bg-muted/30">
                                      <td className="px-3 py-2 font-mono">{row.parcelId}</td>
                                      <td className="px-3 py-2 text-right font-medium text-cyan-400">{formatCurrency(row.predictedValue)}</td>
                                      <td className="px-3 py-2 text-right text-muted-foreground">{formatCurrency(row.currentValue)}</td>
                                      <td className={`px-3 py-2 text-right font-medium ${variancePct == null ? "text-muted-foreground" : isHighVariance ? "text-amber-400" : "text-green-400"}`}>
                                        {variancePct != null ? `${variancePct > 0 ? "+" : ""}${variancePct.toFixed(1)}%` : "—"}
                                      </td>
                                      <td className="px-3 py-2 text-muted-foreground truncate max-w-[120px]">{row.modelType?.startsWith("regression-linear") ? "Linear Regression" : row.modelType ?? "—"}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="h-full flex items-center justify-center rounded-lg border border-dashed border-border min-h-[300px]">
                <div className="text-center text-muted-foreground">
                  <Cpu className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">Select a batch job to view details and results</p>
                  <p className="text-xs mt-1">Or start a new batch job using the form on the left</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
