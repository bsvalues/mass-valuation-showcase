/**
 * Quantum Glass Job Drawer - Global background job monitoring
 * Polling-based updates with ETA calculation and error CSV download
 */

import { useState, useEffect, useRef } from "react";
import { X, Download, Clock, CheckCircle2, AlertCircle, Loader2, Pause } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { QuantumProgressBar } from "./QuantumProgressBar";
import { useJobDrawer } from "@/contexts/JobContext";

export function QuantumJobDrawer() {
  const { isDrawerOpen: isOpen, activeJobId, closeDrawer } = useJobDrawer();
  const jobId = activeJobId?.toString() || null;
  const [progressSamples, setProgressSamples] = useState<Array<{ processed: number; timestamp: number }>>([]);
  
  // Poll job status
  const { data: job, refetch } = trpc.backgroundJobs.getJobStatus.useQuery(
    { jobId: jobId || "" },
    {
      enabled: !!jobId && isOpen,
      refetchInterval: (query) => {
        if (!query.state.data) return false;
        const status = query.state.data.status;
        if (status === 'running' || status === 'pending') return 1500; // 1.5s for active jobs
        if (status === 'completed' || status === 'failed') return false; // Stop polling
        return 8000; // 8s for other states
      },
    }
  );

  // Update progress samples for ETA calculation
  useEffect(() => {
    if (job && job.status === 'running' && (job.processed ?? 0) > 0) {
      setProgressSamples(prev => {
        const newSample = { processed: job.processed ?? 0, timestamp: Date.now() };
        const updated = [...prev, newSample].slice(-10); // Keep last 10 samples
        return updated;
      });
    }
  }, [job?.processed, job?.status]);

  // Calculate ETA
  const calculateETA = (): string | null => {
    if (!job || job.status !== 'running' || progressSamples.length < 2) {
      return null;
    }

    const first = progressSamples[0];
    const last = progressSamples[progressSamples.length - 1];
    
    const deltaProcessed = last.processed - first.processed;
    const deltaTimeSeconds = (last.timestamp - first.timestamp) / 1000;
    
    if (deltaTimeSeconds === 0 || deltaProcessed === 0) return null;
    
    const rate = deltaProcessed / deltaTimeSeconds;
    const remaining = (job.total ?? 0) - (job.processed ?? 0);
    const etaSeconds = remaining / Math.max(rate, 0.0001);
    
    if (etaSeconds < 60) {
      return `~${Math.round(etaSeconds)}s`;
    } else if (etaSeconds < 3600) {
      const minutes = Math.floor(etaSeconds / 60);
      const seconds = Math.round(etaSeconds % 60);
      return `~${minutes}m ${seconds}s`;
    } else {
      const hours = Math.floor(etaSeconds / 3600);
      const minutes = Math.round((etaSeconds % 3600) / 60);
      return `~${hours}h ${minutes}m`;
    }
  };

  const eta = calculateETA();

  // Status badge configuration
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return { label: 'QUEUED', icon: Pause, color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' };
      case 'running':
        return { label: 'RUNNING', icon: Loader2, color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' };
      case 'completed':
        return { label: 'SUCCEEDED', icon: CheckCircle2, color: 'bg-green-500/20 text-green-400 border-green-500/30' };
      case 'failed':
        return { label: 'FAILED', icon: AlertCircle, color: 'bg-red-500/20 text-red-400 border-red-500/30' };
      default:
        return { label: status.toUpperCase(), icon: Pause, color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' };
    }
  };

  if (!isOpen || !jobId || !job) return null;

  const statusConfig = getStatusConfig(job.status);
  const StatusIcon = statusConfig.icon;
  const progressPercent = (job.total ?? 0) > 0 ? ((job.processed ?? 0) / (job.total ?? 1)) * 100 : 0;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={closeDrawer}
      />
      
      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-l border-cyan-500/20 shadow-2xl z-50 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-xl border-b border-cyan-500/20 p-6 z-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
              Background Job
            </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={closeDrawer}
              className="text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-3">
            <Badge className={`${statusConfig.color} border px-3 py-1.5 flex items-center gap-2`}>
              <StatusIcon className={`w-4 h-4 ${job.status === 'running' ? 'animate-spin' : ''}`} />
              {statusConfig.label}
            </Badge>
            {job.countyName && (
              <span className="text-sm text-gray-400">
                {job.countyName} County
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Progress Section */}
          <div className="bg-slate-800/50 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-6 shadow-[0_0_30px_rgba(0,255,238,0.1)]">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-300">Progress</span>
              {eta && (
                <div className="flex items-center gap-2 text-cyan-400">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-mono">{eta}</span>
                </div>
              )}
            </div>

            {/* Quantum Progress Bar */}
            <QuantumProgressBar 
              progress={job.processed ?? 0}
              total={job.total ?? 0}
              status={job.status}
            />

            {/* Counters */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-cyan-400 font-mono">
                  {(job.processed ?? 0).toLocaleString()}
                </div>
                <div className="text-xs text-gray-400 mt-1">Processed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400 font-mono">
                  {(job.succeeded ?? 0).toLocaleString()}
                </div>
                <div className="text-xs text-gray-400 mt-1">Succeeded</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400 font-mono">
                  {(job.failed ?? 0).toLocaleString()}
                </div>
                <div className="text-xs text-gray-400 mt-1">Failed</div>
              </div>
            </div>
          </div>

          {/* Error Summary */}
          {job.errorSummary && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-red-400 mb-1">Error Summary</h3>
                  <p className="text-sm text-gray-300">{job.errorSummary}</p>
                </div>
              </div>
            </div>
          )}

          {/* Download Error CSV */}
          {(job.failed ?? 0) > 0 && (
            <Button
              variant="outline"
              className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
              onClick={async () => {
                try {
                  const utils = trpc.useUtils();
                  const errors = await utils.backgroundJobs.getJobErrors.fetch({ jobId: job.id });
                  
                  // Convert errors to CSV
                  const csvHeader = 'Parcel ID,Error Message,Timestamp\n';
                  const csvRows = errors.map((e: any) => 
                    `"${e.parcelId || 'N/A'}","${(e.errorMessage || '').replace(/"/g, '""')}","${new Date(e.createdAt || '').toISOString()}"`
                  ).join('\n');
                  const csvContent = csvHeader + csvRows;
                  
                  // Download CSV
                  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                  const link = document.createElement('a');
                  link.href = URL.createObjectURL(blob);
                  link.download = `job-${job.id}-errors.csv`;
                  link.click();
                } catch (error) {
                  console.error('Failed to download errors:', error);
                  alert('Failed to download error CSV');
                }
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              Download Error CSV ({job.failed} errors)
            </Button>
          )}

          {/* Job Details */}
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Job ID</span>
              <span className="text-gray-300 font-mono text-xs">{job.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Created</span>
              <span className="text-gray-300">{new Date(job.createdAt).toLocaleString()}</span>
            </div>
            {job.startedAt && (
              <div className="flex justify-between">
                <span className="text-gray-400">Started</span>
                <span className="text-gray-300">{new Date(job.startedAt).toLocaleString()}</span>
              </div>
            )}
            {job.completedAt && (
              <div className="flex justify-between">
                <span className="text-gray-400">Completed</span>
                <span className="text-gray-300">{new Date(job.completedAt).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
