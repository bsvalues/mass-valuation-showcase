import { useState } from "react";
import { BentoCard, BentoGrid } from "@/components/terra/BentoCard";
import { TactileButton } from "@/components/terra/TactileButton";
import { LiquidPanel } from "@/components/terra/LiquidPanel";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Download, Loader2, RefreshCw, FileText, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

/**
 * Assessment Audit Log - TerraFusion Canonical Scene
 * 
 * Design Principles Applied:
 * - Bento Grid for stats cards
 * - LiquidPanel for filters and table
 * - TactileButton for actions (refresh, export)
 * - Glass materials for data surfaces
 */
export default function AssessmentAuditLog() {
  const [filterAction, setFilterAction] = useState<string>("all");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [page, setPage] = useState(0);
  const pageSize = 50;

  // Fetch audit logs with filters
  const { data: logs, isLoading, refetch } = trpc.assessmentReview.getAuditLogs.useQuery({
    limit: pageSize,
    offset: page * pageSize,
    action: filterAction === "all" ? undefined : filterAction,
    startDate: startDate ? startDate.toISOString() : undefined,
    endDate: endDate ? endDate.toISOString() : undefined,
  });

  const handleClearFilters = () => {
    setFilterAction("all");
    setStartDate(undefined);
    setEndDate(undefined);
    setPage(0);
  };

  const handleExport = () => {
    alert("CSV export functionality coming soon");
  };

  const getActionBadgeVariant = (action: string): "default" | "destructive" | "secondary" | "outline" => {
    switch (action.toLowerCase()) {
      case "approve":
      case "bulk_approved":
        return "default";
      case "flag":
      case "bulk_flagged":
        return "destructive";
      case "reset":
      case "bulk_pending":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getStatusBadgeVariant = (status: string): "default" | "destructive" | "secondary" | "outline" => {
    switch (status) {
      case "approved":
        return "default";
      case "flagged":
        return "destructive";
      case "pending":
        return "secondary";
      default:
        return "outline";
    }
  };

  // Calculate stats
  const totalLogs = logs?.length || 0;
  const approveCount = logs?.filter(l => l.action.toLowerCase().includes("approve")).length || 0;
  const flagCount = logs?.filter(l => l.action.toLowerCase().includes("flag")).length || 0;
  const pendingCount = logs?.filter(l => l.newStatus === "pending").length || 0;

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-text-primary mb-2">
            Assessment Audit Log
          </h1>
          <p className="text-lg text-text-secondary">
            Track all assessment status changes and bulk actions for compliance
          </p>
        </div>
        <div className="flex gap-2">
          <TactileButton variant="glass" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </TactileButton>
          <TactileButton variant="neon" size="sm" commitment onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </TactileButton>
        </div>
      </div>

      {/* Stats Bento Grid */}
      <BentoGrid>
        <BentoCard
          title="Total Entries"
          icon={<FileText className="w-5 h-5" />}
          span="1"
        >
          <div className="text-4xl font-bold text-text-primary">{totalLogs}</div>
          <div className="text-sm text-text-secondary mt-1">Audit log entries</div>
        </BentoCard>

        <BentoCard
          title="Approvals"
          icon={<CheckCircle2 className="w-5 h-5 text-chart-4" />}
          span="1"
        >
          <div className="text-4xl font-bold text-chart-4">{approveCount}</div>
          <div className="text-sm text-text-secondary mt-1">Properties approved</div>
        </BentoCard>

        <BentoCard
          title="Flagged"
          icon={<AlertTriangle className="w-5 h-5 text-signal-alert" />}
          span="1"
        >
          <div className="text-4xl font-bold text-signal-alert">{flagCount}</div>
          <div className="text-sm text-text-secondary mt-1">Properties flagged</div>
        </BentoCard>

        <BentoCard
          title="Reset to Pending"
          icon={<Clock className="w-5 h-5" />}
          span="1"
        >
          <div className="text-4xl font-bold text-text-primary">{pendingCount}</div>
          <div className="text-sm text-text-secondary mt-1">Status resets</div>
        </BentoCard>
      </BentoGrid>

      {/* Filters */}
      <LiquidPanel intensity={1} className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-text-primary">Filters</h3>
            <TactileButton variant="glass" size="sm" onClick={handleClearFilters}>
              Clear All
            </TactileButton>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Action Filter */}
            <div className="space-y-2">
              <label className="text-sm text-text-secondary">Action Type</label>
              <Select value={filterAction} onValueChange={setFilterAction}>
                <SelectTrigger className="bg-glass-2 border-glass-border">
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="bulk_approved">Bulk Approve</SelectItem>
                  <SelectItem value="bulk_flagged">Bulk Flag</SelectItem>
                  <SelectItem value="bulk_pending">Bulk Reset</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Start Date */}
            <div className="space-y-2">
              <label className="text-sm text-text-secondary">Start Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <TactileButton
                    variant="glass"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-text-secondary"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Pick a date"}
                  </TactileButton>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-glass-1 border-glass-border">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <label className="text-sm text-text-secondary">End Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <TactileButton
                    variant="glass"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-text-secondary"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Pick a date"}
                  </TactileButton>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-glass-1 border-glass-border">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </LiquidPanel>

      {/* Audit Log Table */}
      <LiquidPanel intensity={1} className="overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-signal-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-glass-border hover:bg-glass-1">
                  <TableHead className="text-text-secondary">Timestamp</TableHead>
                  <TableHead className="text-text-secondary">Property ID</TableHead>
                  <TableHead className="text-text-secondary">Action</TableHead>
                  <TableHead className="text-text-secondary">Old Status</TableHead>
                  <TableHead className="text-text-secondary">New Status</TableHead>
                  <TableHead className="text-text-secondary">User</TableHead>
                  <TableHead className="text-text-secondary">Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!logs || logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <FileText className="w-12 h-12 text-text-secondary" />
                        <div>
                          <p className="text-lg font-medium text-text-primary">No Audit Logs Found</p>
                          <p className="text-sm text-text-secondary mt-1">
                            Try adjusting your filters or date range
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id} className="border-glass-border hover:bg-glass-1 transition-colors">
                      <TableCell className="text-text-primary">
                        {new Date(log.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-text-primary">
                        {log.propertyId}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getActionBadgeVariant(log.action)}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(log.oldStatus || "")}>
                          {log.oldStatus || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(log.newStatus)}>
                          {log.newStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-text-primary">
                        {log.userName || `User ${log.userId}`}
                      </TableCell>
                      <TableCell className="text-text-secondary text-sm max-w-xs truncate">
                        {log.notes || "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </LiquidPanel>

      {/* Pagination */}
      {logs && logs.length >= pageSize && (
        <div className="flex items-center justify-between">
          <TactileButton
            variant="glass"
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
          >
            Previous
          </TactileButton>
          <span className="text-sm text-text-secondary">
            Page {page + 1}
          </span>
          <TactileButton
            variant="glass"
            onClick={() => setPage(page + 1)}
            disabled={logs.length < pageSize}
          >
            Next
          </TactileButton>
        </div>
      )}
    </div>
  );
}
