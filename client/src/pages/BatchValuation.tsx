import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Play, X, Download } from "lucide-react";

export default function BatchValuation() {
  const [batchName, setBatchName] = useState("");
  const [parcelIds, setParcelIds] = useState("");

  const { data: batchJobs, refetch } = trpc.batchValuation.listBatchJobs.useQuery();
  const startBatchMutation = trpc.batchValuation.startBatch.useMutation();
  const cancelBatchMutation = trpc.batchValuation.cancelBatch.useMutation();

  const handleStartBatch = async () => {
    if (!batchName.trim()) {
      toast.error("Please enter a batch name");
      return;
    }

    if (!parcelIds.trim()) {
      toast.error("Please enter parcel IDs");
      return;
    }

    const ids = parcelIds.split(/[,\n]/).map(id => id.trim()).filter(Boolean);
    if (ids.length === 0) {
      toast.error("No valid parcel IDs found");
      return;
    }

    try {
      await startBatchMutation.mutateAsync({
        name: batchName,
        parcelIds: ids,
      });

      toast.success(`Batch job "${batchName}" started with ${ids.length} parcels`);
      setBatchName("");
      setParcelIds("");
      refetch();
    } catch (error) {
      toast.error("Failed to start batch job");
    }
  };

  const handleCancelBatch = async (batchJobId: number) => {
    try {
      await cancelBatchMutation.mutateAsync({ batchJobId });
      toast.success("Batch job cancelled");
      refetch();
    } catch (error) {
      toast.error("Failed to cancel batch job");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      processing: "default",
      completed: "outline",
      failed: "destructive",
      cancelled: "secondary",
    };

    return (
      <Badge variant={variants[status] || "default"}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="container py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Batch Valuation Processing</h1>
        <p className="text-muted-foreground mt-2">
          Run AVM predictions on thousands of parcels simultaneously
        </p>
      </div>

      {/* Start New Batch */}
      <Card>
        <CardHeader>
          <CardTitle>Start New Batch Job</CardTitle>
          <CardDescription>
            Enter parcel IDs (comma or newline separated) to run batch valuations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="batchName">Batch Name</Label>
            <Input
              id="batchName"
              placeholder="e.g., Q1 2026 Revaluation"
              value={batchName}
              onChange={(e) => setBatchName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="parcelIds">Parcel IDs</Label>
            <textarea
              id="parcelIds"
              className="w-full min-h-[120px] p-3 border rounded-md"
              placeholder="Enter parcel IDs separated by commas or new lines&#10;e.g., 12345, 67890, 11223"
              value={parcelIds}
              onChange={(e) => setParcelIds(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              {parcelIds.split(/[,\n]/).filter(id => id.trim()).length} parcels
            </p>
          </div>

          <Button
            onClick={handleStartBatch}
            disabled={startBatchMutation.isPending}
            className="w-full"
          >
            <Play className="w-4 h-4 mr-2" />
            Start Batch Processing
          </Button>
        </CardContent>
      </Card>

      {/* Batch Jobs List */}
      <Card>
        <CardHeader>
          <CardTitle>Batch Jobs</CardTitle>
          <CardDescription>View and manage your batch valuation jobs</CardDescription>
        </CardHeader>
        <CardContent>
          {!batchJobs || batchJobs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No batch jobs yet. Start your first batch above.
            </p>
          ) : (
            <div className="space-y-4">
              {batchJobs.map((job) => (
                <Card key={job.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{job.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Created {new Date(job.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(job.status)}
                        {job.status === "processing" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelBatch(job.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                        {job.status === "completed" && job.resultsUrl && (
                          <Button variant="outline" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span className="font-medium">{job.progress}%</span>
                      </div>
                      <Progress value={job.progress} />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>
                          {job.processedParcels} / {job.totalParcels} parcels processed
                        </span>
                        <span>
                          ✓ {job.successfulParcels} · ✗ {job.failedParcels}
                        </span>
                      </div>
                    </div>

                    {job.errorSummary && (
                      <div className="mt-4 p-3 bg-destructive/10 rounded-md">
                        <p className="text-sm text-destructive font-medium">Errors:</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {job.errorSummary.substring(0, 200)}
                          {job.errorSummary.length > 200 && "..."}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
