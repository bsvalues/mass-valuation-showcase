/**
 * JobStatusCard - Display background job status with TerraFusion aesthetic
 */

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, Clock, Loader2, MapPin, Eye } from "lucide-react";
import { QuantumProgressBar } from "./QuantumProgressBar";
import { Link } from "wouter";

interface JobStatusCardProps {
  job: {
    id: string;
    countyName: string;
    status: "pending" | "running" | "completed" | "failed";
    progress: number;
    total: number;
    createdAt: Date | string;
    completedAt?: Date | string | null;
    errorMessage?: string | null;
    resultSummary?: string | null;
  };
  onViewData?: () => void;
}

export function JobStatusCard({ job, onViewData }: JobStatusCardProps) {
  const getStatusIcon = () => {
    switch (job.status) {
      case "completed":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "running":
        return <Loader2 className="w-5 h-5 text-primary animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = () => {
    const variants: Record<string, { label: string; className: string }> = {
      pending: { label: "Pending", className: "bg-muted text-muted-foreground" },
      running: { label: "Running", className: "bg-primary/20 text-primary border-primary/30" },
      completed: { label: "Completed", className: "bg-green-500/20 text-green-500 border-green-500/30" },
      failed: { label: "Failed", className: "bg-red-500/20 text-red-500 border-red-500/30" },
    };

    const variant = variants[job.status];
    return (
      <Badge variant="outline" className={variant.className}>
        {variant.label}
      </Badge>
    );
  };

  const getResultSummary = () => {
    if (!job.resultSummary) return null;
    try {
      return JSON.parse(job.resultSummary);
    } catch {
      return null;
    }
  };

  const summary = getResultSummary();
  const currentChunk = job.total > 0 ? Math.ceil(job.progress / 2000) : undefined;
  const totalChunks = job.total > 0 ? Math.ceil(job.total / 2000) : undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="terra-card bg-[rgba(10,14,26,0.6)] border-primary/20 shadow-[0_0_30px_rgba(0,255,238,0.15)]">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon()}
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  {job.countyName} County
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Started {new Date(job.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Progress Bar for Running Jobs */}
          {job.status === "running" && (
            <QuantumProgressBar
              progress={job.progress}
              total={job.total}
              currentChunk={currentChunk}
              totalChunks={totalChunks}
              status="Quantum loading parcels..."
            />
          )}

          {/* Pending Status */}
          {job.status === "pending" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-background/20 rounded-lg p-3 border border-primary/10">
              <Clock className="w-4 h-4" />
              <span>Waiting for worker to pick up job...</span>
            </div>
          )}

          {/* Completed Status */}
          {job.status === "completed" && summary && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-background/20 rounded-lg p-3 border border-green-500/20">
                  <p className="text-xs text-muted-foreground">Parcels Loaded</p>
                  <p className="text-2xl font-bold text-green-500">
                    {summary.parcelCount?.toLocaleString() || "0"}
                  </p>
                </div>
                <div className="bg-background/20 rounded-lg p-3 border border-primary/20">
                  <p className="text-xs text-muted-foreground">Duration</p>
                  <p className="text-2xl font-bold text-primary">
                    {summary.durationSeconds ? `${summary.durationSeconds}s` : "N/A"}
                  </p>
                </div>
              </div>

              <Button
                className="w-full bg-primary/20 hover:bg-primary/30 text-primary border-primary/30"
                onClick={onViewData}
              >
                <Eye className="w-4 h-4 mr-2" />
                View Data on Map
              </Button>
            </div>
          )}

          {/* Failed Status */}
          {job.status === "failed" && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <p className="text-sm text-red-500 font-medium mb-1">Error</p>
              <p className="text-xs text-red-400">{job.errorMessage || "Unknown error occurred"}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
