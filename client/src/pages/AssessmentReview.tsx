import { useState, useEffect, useRef, useCallback } from "react";
import { BentoCard, BentoGrid } from "@/components/terra/BentoCard";
import { TactileButton } from "@/components/terra/TactileButton";
import { LiquidPanel } from "@/components/terra/LiquidPanel";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { AlertTriangle, TrendingUp, Clock, CheckCircle2, Filter, Loader2, CheckSquare, Square, Target } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { PropertyPreviewCard } from "@/components/PropertyPreviewCard";
import { BatchActionDialog, type BatchActionType } from "@/components/BatchActionDialog";

interface HighVarianceProperty {
  id: string;
  parcelId: string;
  address: string;
  assessedValue: number;
  salePrice: number;
  ratio: number;
  clusterMedianRatio: number;
  variancePercent: number;
  severity: "warning" | "critical";
  clusterId: number;
  lastReviewDate?: string;
  status: "pending" | "approved" | "flagged";
}

/**
 * Assessment Review - TerraFusion Canonical Scene
 * 
 * Design Principles Applied:
 * - Bento Grid for KPI cards (attention allocators)
 * - LiquidPanel for chart visualization (OS chrome)
 * - TactileButton for bulk actions (commitment actions)
 * - Glass materials for table (data-dense surface)
 * - Keyboard shortcuts (A/F/Esc) for power users
 */
export default function AssessmentReview() {
  const [, setLocation] = useLocation();
  const [sortBy, setSortBy] = useState<string>("variancePercent");
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [hoveredProperty, setHoveredProperty] = useState<HighVarianceProperty | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  // Batch confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: BatchActionType;
  }>({ open: false, action: "approved" });
  // Undo snapshot: stores previous statuses before a bulk action
  const [undoSnapshot, setUndoSnapshot] = useState<{
    ids: number[];
    previousStatuses: Record<number, "pending" | "approved" | "flagged">;
    action: BatchActionType;
  } | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // J/K keyboard navigation state
  const [focusedRowIndex, setFocusedRowIndex] = useState<number>(-1);
  const rowRefs = useRef<Map<number, HTMLTableRowElement>>(new Map());
  const utils = trpc.useUtils();
  
  // Bulk update mutation
  const bulkUpdate = trpc.assessmentReview.bulkUpdateStatus.useMutation({
    onSuccess: (data) => {
      utils.assessmentReview.getHighVarianceProperties.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update properties");
    },
  });

  // Undo mutation — reverses a bulk action by restoring previous statuses
  const undoBulkUpdate = trpc.assessmentReview.bulkUpdateStatus.useMutation({
    onSuccess: () => {
      toast.success("Action undone — properties restored to previous status.");
      setUndoSnapshot(null);
      utils.assessmentReview.getHighVarianceProperties.invalidate();
    },
    onError: () => {
      toast.error("Undo failed — please refresh and try again.");
    },
  });

  // Clean up undo timer on unmount
  useEffect(() => {
    return () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    };
  }, []);

  // Fetch high-variance properties
  const { data: highVarianceData, isLoading } = trpc.assessmentReview.getHighVarianceProperties.useQuery({
    minVariancePercent: 15,
    limit: 100,
    offset: 0,
    severity: filterSeverity as "all" | "warning" | "critical",
    status: filterStatus as "all" | "pending" | "approved" | "flagged",
  });

  const properties: HighVarianceProperty[] = (highVarianceData || []).map(p => ({
    id: p.id.toString(),
    parcelId: p.parcelId,
    address: p.address || "Unknown",
    assessedValue: p.assessedValue || 0,
    salePrice: p.salePrice || 0,
    ratio: p.ratio,
    clusterMedianRatio: p.clusterMedianRatio,
    variancePercent: p.variancePercent,
    severity: p.severity,
    clusterId: p.clusterId || 0,
    lastReviewDate: p.lastReviewDate || undefined,
    status: p.status,
  }));

  const sortedProperties = [...properties].sort((a, b) => {
    if (sortBy === "variancePercent") {
      return Math.abs(b.variancePercent) - Math.abs(a.variancePercent);
    }
    return 0;
  });

  // Summary stats
  const totalProperties = properties.length;
  const criticalCount = properties.filter(p => p.severity === "critical").length;
  const warningCount = properties.filter(p => p.severity === "warning").length;
  const pendingCount = properties.filter(p => p.status === "pending").length;

  // Variance distribution for chart
  const varianceDistribution = [
    { range: "15-20%", count: properties.filter(p => Math.abs(p.variancePercent) > 15 && Math.abs(p.variancePercent) <= 20).length },
    { range: "20-25%", count: properties.filter(p => Math.abs(p.variancePercent) > 20 && Math.abs(p.variancePercent) <= 25).length },
    { range: "25-30%", count: properties.filter(p => Math.abs(p.variancePercent) > 25 && Math.abs(p.variancePercent) <= 30).length },
    { range: "30%+", count: properties.filter(p => Math.abs(p.variancePercent) > 30).length },
  ];

  // Bulk actions
  const handleSelectAll = () => {
    if (selectedIds.size === sortedProperties.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedProperties.map(p => p.id)));
    }
  };

  // Step 1: Open confirmation dialog
  const handleBulkAction = (status: BatchActionType) => {
    if (selectedIds.size === 0) {
      toast.error("No properties selected");
      return;
    }
    setConfirmDialog({ open: true, action: status });
  };

  // Step 2: Execute after user confirms in dialog
  const executeBulkAction = () => {
    const ids = Array.from(selectedIds).map(id => parseInt(id));
    const newStatus = confirmDialog.action;

    // Capture undo snapshot BEFORE mutating
    const previousStatuses: Record<number, "pending" | "approved" | "flagged"> = {};
    ids.forEach(id => {
      const prop = properties.find(p => p.id === id.toString());
      if (prop) previousStatuses[id] = prop.status;
    });
    setUndoSnapshot({ ids, previousStatuses, action: newStatus });

    // Fire the bulk update
    bulkUpdate.mutate({
      propertyIds: ids,
      newStatus,
      action: `bulk_${newStatus}`,
      notes: `Bulk ${newStatus} action via Assessment Review`,
    });
    setConfirmDialog(prev => ({ ...prev, open: false }));
    setSelectedIds(new Set());

    // Clear any existing undo timer
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);

    // Show 8-second undo toast with countdown
    let countdown = 8;
    const toastId = `undo-bulk-${Date.now()}`;

    const showCountdownToast = (remaining: number) => {
      toast(
        <div className="flex items-center justify-between gap-4 w-full">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {ids.length} properties {newStatus}.
            </span>
            <span className="text-xs text-muted-foreground tabular-nums">
              Undo in {remaining}s
            </span>
          </div>
          <button
            onClick={() => {
              if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
              toast.dismiss(toastId);
              // Per-property granularity: group IDs by their individual previous status
              // and fire one mutation per unique previous status group
              const groups: Record<string, number[]> = {};
              Object.entries(previousStatuses).forEach(([id, prevStatus]) => {
                if (!groups[prevStatus]) groups[prevStatus] = [];
                groups[prevStatus].push(parseInt(id));
              });
              // Fire one mutation per unique previous status (perfect per-property restoration)
              Object.entries(groups).forEach(([prevStatus, groupIds]) => {
                undoBulkUpdate.mutate({
                  propertyIds: groupIds,
                  newStatus: prevStatus as "pending" | "approved" | "flagged",
                  action: `undo_bulk_${newStatus}`,
                  notes: `Undo of bulk ${newStatus} — restoring ${groupIds.length} properties to '${prevStatus}'`,
                });
              });
            }}
            className="px-3 py-1 text-xs font-semibold rounded-md bg-signal-primary text-government-night-base hover:opacity-90 transition-opacity flex-shrink-0"
          >
            Undo
          </button>
        </div>,
        {
          id: toastId,
          duration: 8500,
        }
      );
    };

    showCountdownToast(countdown);

    // Update countdown every second
    const interval = setInterval(() => {
      countdown -= 1;
      if (countdown <= 0) {
        clearInterval(interval);
        setUndoSnapshot(null);
      } else {
        showCountdownToast(countdown);
      }
    }, 1000);

    undoTimerRef.current = setTimeout(() => {
      clearInterval(interval);
      setUndoSnapshot(null);
    }, 8500);
  };

  // Keyboard shortcuts (A/F/Esc bulk actions + J/K row navigation + Space selection)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      // Ignore if a dialog or modal is open
      if (document.querySelector('[role="dialog"]')) return;

      if (e.key.toLowerCase() === "a" && selectedIds.size > 0) {
        e.preventDefault();
        handleBulkAction("approved");
      } else if (e.key.toLowerCase() === "f" && selectedIds.size > 0) {
        e.preventDefault();
        handleBulkAction("flagged");
      } else if (e.key === "Escape") {
        e.preventDefault();
        setSelectedIds(new Set());
        setFocusedRowIndex(-1);
      } else if (e.key.toLowerCase() === "j") {
        // Move focus down
        e.preventDefault();
        setFocusedRowIndex(prev => {
          const next = Math.min(prev + 1, sortedProperties.length - 1);
          // Scroll into view
          const el = rowRefs.current.get(next);
          if (el) el.scrollIntoView({ block: "nearest", behavior: "smooth" });
          return next;
        });
      } else if (e.key.toLowerCase() === "k") {
        // Move focus up
        e.preventDefault();
        setFocusedRowIndex(prev => {
          const next = Math.max(prev - 1, 0);
          const el = rowRefs.current.get(next);
          if (el) el.scrollIntoView({ block: "nearest", behavior: "smooth" });
          return next;
        });
      } else if (e.key === " " && focusedRowIndex >= 0) {
        // Space toggles selection of focused row
        e.preventDefault();
        const prop = sortedProperties[focusedRowIndex];
        if (prop) {
          const newSelected = new Set(selectedIds);
          if (newSelected.has(prop.id)) {
            newSelected.delete(prop.id);
          } else {
            newSelected.add(prop.id);
          }
          setSelectedIds(newSelected);
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [selectedIds, focusedRowIndex, sortedProperties]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-signal-primary mx-auto mb-4 animate-spin" />
          <p className="text-text-secondary">Loading assessment data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold text-text-primary mb-2">
            Assessment Review
          </h1>
          <p className="text-lg text-text-secondary">
            High-variance properties requiring attention. {totalProperties} properties flagged with ratio variance &gt;15%.
          </p>
        </div>
        {/* Keyboard navigation hints */}
        <div className="flex items-center gap-2 mt-1 text-xs text-text-secondary shrink-0">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-glass-2 border border-glass-border rounded font-mono">J</kbd>
            <kbd className="px-1.5 py-0.5 bg-glass-2 border border-glass-border rounded font-mono">K</kbd>
            navigate
          </span>
          <span className="text-glass-border">·</span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-glass-2 border border-glass-border rounded font-mono">Space</kbd>
            select
          </span>
          <span className="text-glass-border">·</span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-glass-2 border border-glass-border rounded font-mono">A</kbd>
            approve
          </span>
          <span className="text-glass-border">·</span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-glass-2 border border-glass-border rounded font-mono">F</kbd>
            flag
          </span>
        </div>
      </div>

      {/* KPI Bento Grid */}
      <BentoGrid>
        <BentoCard
          title="Total Flagged"
          icon={<AlertTriangle className="w-5 h-5" />}
          span="1"
        >
          <div className="text-4xl font-bold text-text-primary">{totalProperties}</div>
          <div className="text-sm text-text-secondary mt-1">Properties requiring review</div>
        </BentoCard>

        <BentoCard
          title="Critical"
          icon={<AlertTriangle className="w-5 h-5 text-signal-alert" />}
          span="1"
          actionable={criticalCount > 0}
        >
          <div className="text-4xl font-bold text-signal-alert">{criticalCount}</div>
          <div className="text-sm text-text-secondary mt-1">Variance &gt;25%</div>
        </BentoCard>

        <BentoCard
          title="Warning"
          icon={<TrendingUp className="w-5 h-5 text-chart-3" />}
          span="1"
        >
          <div className="text-4xl font-bold text-chart-3">{warningCount}</div>
          <div className="text-sm text-text-secondary mt-1">Variance 15-25%</div>
        </BentoCard>

        <BentoCard
          title="Pending Review"
          icon={<Clock className="w-5 h-5" />}
          span="1"
        >
          <div className="text-4xl font-bold text-text-primary">{pendingCount}</div>
          <div className="text-sm text-text-secondary mt-1">Awaiting action</div>
        </BentoCard>
      </BentoGrid>

      {/* Variance Distribution Chart */}
      <LiquidPanel intensity={2} className="p-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Variance Distribution</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={varianceDistribution}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="range" stroke="rgba(255,255,255,0.5)" />
            <YAxis stroke="rgba(255,255,255,0.5)" />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(10, 14, 26, 0.9)",
                border: "1px solid rgba(0, 255, 238, 0.3)",
                borderRadius: "8px",
              }}
            />
            <Bar dataKey="count" fill="var(--color-signal-primary)" />
          </BarChart>
        </ResponsiveContainer>
      </LiquidPanel>

      {/* Filters & Bulk Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Select value={filterSeverity} onValueChange={setFilterSeverity}>
            <SelectTrigger className="w-40 bg-glass-1 border-glass-border">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severity</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40 bg-glass-1 border-glass-border">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="flagged">Flagged</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-secondary">
              {selectedIds.size} selected
            </span>
            <TactileButton
              variant="neon"
              size="sm"
              commitment
              onClick={() => handleBulkAction("approved")}
              disabled={bulkUpdate.isPending}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Approve <kbd className="ml-2 px-1.5 py-0.5 text-xs bg-glass-2 rounded">A</kbd>
            </TactileButton>
            <TactileButton
              variant="glass"
              size="sm"
              commitment
              onClick={() => handleBulkAction("flagged")}
              disabled={bulkUpdate.isPending}
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Flag <kbd className="ml-2 px-1.5 py-0.5 text-xs bg-glass-2 rounded">F</kbd>
            </TactileButton>
            <TactileButton
              variant="glass"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
            >
              Clear <kbd className="ml-2 px-1.5 py-0.5 text-xs bg-glass-2 rounded">Esc</kbd>
            </TactileButton>
          </div>
        )}
      </div>

      {/* Properties Table */}
      <LiquidPanel intensity={1} className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-glass-border hover:bg-glass-1">
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedIds.size === sortedProperties.length && sortedProperties.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead className="text-text-secondary">Parcel ID</TableHead>
                <TableHead className="text-text-secondary">Address</TableHead>
                <TableHead className="text-text-secondary text-right">Assessed Value</TableHead>
                <TableHead className="text-text-secondary text-right">Sale Price</TableHead>
                <TableHead className="text-text-secondary text-right">Ratio</TableHead>
                <TableHead className="text-text-secondary text-right">Variance</TableHead>
                <TableHead className="text-text-secondary">Severity</TableHead>
                <TableHead className="text-text-secondary">Status</TableHead>
                <TableHead className="text-text-secondary">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedProperties.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <CheckCircle2 className="w-12 h-12 text-chart-4" />
                      <div>
                        <p className="text-lg font-medium text-text-primary">No High-Variance Properties Found</p>
                        <p className="text-sm text-text-secondary mt-1">
                          All properties are within acceptable variance thresholds. Try adjusting filters.
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                sortedProperties.map((property, rowIdx) => (
                  <TableRow
                    key={property.id}
                    ref={(el) => {
                      if (el) rowRefs.current.set(rowIdx, el);
                      else rowRefs.current.delete(rowIdx);
                    }}
                    className={`border-glass-border hover:bg-glass-1 transition-colors cursor-pointer ${
                      focusedRowIndex === rowIdx
                        ? "ring-1 ring-inset ring-signal-primary bg-glass-1"
                        : ""
                    }`}
                    onClick={() => setFocusedRowIndex(rowIdx)}
                    onMouseEnter={(e) => {
                      setHoveredProperty(property);
                      setMousePosition({ x: e.clientX, y: e.clientY });
                    }}
                    onMouseMove={(e) => {
                      setMousePosition({ x: e.clientX, y: e.clientY });
                    }}
                    onMouseLeave={() => setHoveredProperty(null)}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(property.id)}
                        onCheckedChange={(checked) => {
                          const newSelected = new Set(selectedIds);
                          if (checked) {
                            newSelected.add(property.id);
                          } else {
                            newSelected.delete(property.id);
                          }
                          setSelectedIds(newSelected);
                        }}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-sm text-text-primary">{property.parcelId}</TableCell>
                    <TableCell className="text-text-primary">{property.address}</TableCell>
                    <TableCell className="text-right text-text-primary">
                      ${property.assessedValue.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-text-primary">
                      ${property.salePrice.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-text-primary">
                      {property.ratio.toFixed(3)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      <span className={property.variancePercent > 0 ? "text-chart-4" : "text-signal-alert"}>
                        {property.variancePercent > 0 ? "+" : ""}
                        {property.variancePercent.toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={property.severity === "critical" ? "destructive" : "default"}>
                        {property.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          property.status === "approved"
                            ? "default"
                            : property.status === "flagged"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {property.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <TactileButton
                        variant="glass"
                        size="sm"
                        onClick={() => setLocation(`/property-comparison?ids=${property.id}`)}
                      >
                        <Target className="w-4 h-4 mr-1" />
                        Analyze
                      </TactileButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </LiquidPanel>

      {/* Property Preview Card */}
      {hoveredProperty && (
        <PropertyPreviewCard
          property={{
            parcelId: hoveredProperty.parcelId,
            address: hoveredProperty.address,
            sqft: 0, // Not available in this context
            yearBuilt: 0,
            bedrooms: 0,
            bathrooms: 0,
            assessedValue: hoveredProperty.assessedValue,
            salePrice: hoveredProperty.salePrice,
          }}
          position={mousePosition}
        />
      )}

      {/* Batch Action Confirmation Dialog */}
      <BatchActionDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
        action={confirmDialog.action}
        selectedCount={selectedIds.size}
        severity={{
          critical: Array.from(selectedIds).filter(id => {
            const p = properties.find(p => p.id === id);
            return p?.severity === "critical";
          }).length,
          warning: Array.from(selectedIds).filter(id => {
            const p = properties.find(p => p.id === id);
            return p?.severity === "warning";
          }).length,
        }}
        isPending={bulkUpdate.isPending}
        onConfirm={executeBulkAction}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
      />
    </div>
  );
}
