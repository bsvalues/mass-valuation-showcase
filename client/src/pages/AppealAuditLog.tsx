import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Calendar, User, FileText, Filter, Download, Loader2 } from "lucide-react";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  in_review: "bg-blue-100 text-blue-800",
  hearing_scheduled: "bg-purple-100 text-purple-800",
  resolved: "bg-green-100 text-green-800",
  withdrawn: "bg-gray-100 text-gray-800",
};

export default function AppealAuditLog() {
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [transitionFilter, setTransitionFilter] = useState<string>("all");

  // Fetch real-time audit log data from tRPC — queries appealTimeline table
  const { data: auditLogs = [], isLoading } = trpc.appeals.getAuditLog.useQuery({
    startDate: dateRange.start,
    endDate: dateRange.end,
    status: statusFilter !== "all" ? statusFilter : undefined,
    transitionType: transitionFilter !== "all" ? transitionFilter : undefined,
  });

  const handleExport = () => {
    if (auditLogs.length === 0) {
      return;
    }
    // Generate RFC-4180 compliant CSV
    const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [
      ["Appeal ID", "Parcel ID", "County", "Previous Status", "New Status", "Action", "Performed By", "Changed At", "Notes"].join(","),
      ...auditLogs.map(log => [
        log.appealId,
        escape(log.parcelId ?? ""),
        escape(log.countyName ?? ""),
        log.previousStatus ?? "",
        log.newStatus,
        escape(log.action),
        log.performedBy ?? "System",
        format(new Date(log.createdAt), "yyyy-MM-dd HH:mm:ss"),
        escape(log.notes ?? ""),
      ].join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `appeal-audit-log-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Appeal Audit Log</h1>
            <p className="text-muted-foreground">
              Track all status changes and actions across appeals for compliance reporting
            </p>
          </div>
          <Button onClick={handleExport} disabled={auditLogs.length === 0 || isLoading}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Filters
            </CardTitle>
            <CardDescription>Filter audit log by date range, status, and transition type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status-filter">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger id="status-filter">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_review">In Review</SelectItem>
                    <SelectItem value="hearing_scheduled">Hearing Scheduled</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="withdrawn">Withdrawn</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="transition-filter">Transition Type</Label>
                <Select value={transitionFilter} onValueChange={setTransitionFilter}>
                  <SelectTrigger id="transition-filter">
                    <SelectValue placeholder="All transitions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Transitions</SelectItem>
                    <SelectItem value="Status changed">Status Changed</SelectItem>
                    <SelectItem value="Hearing scheduled">Hearing Scheduled</SelectItem>
                    <SelectItem value="Documents uploaded">Documents Uploaded</SelectItem>
                    <SelectItem value="Comment added">Comment Added</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Audit Log Table */}
        <Card>
          <CardHeader>
            <CardTitle>Status Change History</CardTitle>
            <CardDescription>
              {isLoading
                ? "Loading..."
                : `Showing ${auditLogs.length} status changes from ${format(new Date(dateRange.start), "MMM d, yyyy")} to ${format(new Date(dateRange.end), "MMM d, yyyy")}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Loading audit log...
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No audit log entries found</p>
                <p className="text-sm mt-1">Try expanding the date range or clearing filters</p>
              </div>
            ) : (
              <div className="space-y-4">
                {auditLogs.map((log) => (
                  <div key={log.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm text-muted-foreground">
                            Appeal #{log.appealId}
                          </span>
                          {log.parcelId && (
                            <>
                              <span className="text-sm text-muted-foreground">•</span>
                              <span className="font-medium">{log.parcelId}</span>
                            </>
                          )}
                          {log.countyName && (
                            <>
                              <span className="text-sm text-muted-foreground">•</span>
                              <span className="text-sm text-muted-foreground">{log.countyName}</span>
                            </>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {log.previousStatus ? (
                            <>
                              <Badge className={statusColors[log.previousStatus] ?? "bg-gray-100 text-gray-800"}>
                                {log.previousStatus.replace(/_/g, " ").toUpperCase()}
                              </Badge>
                              <span className="text-muted-foreground">→</span>
                            </>
                          ) : null}
                          <Badge className={statusColors[log.newStatus] ?? "bg-gray-100 text-gray-800"}>
                            {log.newStatus.replace(/_/g, " ").toUpperCase()}
                          </Badge>
                          <span className="text-sm text-muted-foreground ml-2 italic">{log.action}</span>
                        </div>

                        {log.notes && (
                          <p className="text-sm text-muted-foreground flex items-start gap-2">
                            <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            {log.notes}
                          </p>
                        )}
                      </div>

                      <div className="text-right space-y-1 flex-shrink-0">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground justify-end">
                          <User className="w-4 h-4" />
                          {log.performedBy ? `User #${log.performedBy}` : "System"}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground justify-end">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(log.createdAt), "MMM d, yyyy")}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(log.createdAt), "h:mm a")}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
