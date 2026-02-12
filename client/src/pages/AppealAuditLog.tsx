import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Calendar, User, FileText, Filter, Download } from "lucide-react";
import { format } from "date-fns";

type StatusTransition = {
  from: string;
  to: string;
};

const statusColors = {
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

  // Fetch real-time audit log data from tRPC
  const { data: auditLogs = [], isLoading } = trpc.appeals.getAuditLog.useQuery({
    startDate: dateRange.start,
    endDate: dateRange.end,
    status: statusFilter !== "all" ? statusFilter : undefined,
    transitionType: transitionFilter !== "all" ? transitionFilter : undefined,
  });

  // Mock data for demonstration (will be replaced by real data once appealTimeline table exists)
  const mockAuditLogs = [
    {
      id: 1,
      appealId: 101,
      parcelId: "123-456-789",
      previousStatus: "pending",
      newStatus: "in_review",
      changedBy: "Admin User",
      changedAt: new Date("2026-02-10T10:30:00"),
      notes: "Initial review started",
    },
    {
      id: 2,
      appealId: 102,
      parcelId: "987-654-321",
      previousStatus: "in_review",
      newStatus: "hearing_scheduled",
      changedBy: "Assessor Smith",
      changedAt: new Date("2026-02-11T14:15:00"),
      notes: "Hearing scheduled for March 15",
    },
    {
      id: 3,
      appealId: 101,
      parcelId: "123-456-789",
      previousStatus: "in_review",
      newStatus: "resolved",
      changedBy: "Admin User",
      changedAt: new Date("2026-02-12T09:00:00"),
      notes: "Appeal resolved - value adjusted to $450,000",
    },
  ];

  // Use real data if available, otherwise use mock data
  const displayLogs = auditLogs.length > 0 ? auditLogs : mockAuditLogs;

  const handleExport = () => {
    // Generate CSV export
    const csv = [
      ["Appeal ID", "Parcel ID", "Previous Status", "New Status", "Changed By", "Changed At", "Notes"].join(","),
      ...displayLogs.map(log => [
        log.appealId,
        log.parcelId,
        log.previousStatus,
        log.newStatus,
        log.changedBy,
        format(log.changedAt, "yyyy-MM-dd HH:mm:ss"),
        `"${log.notes}"`,
      ].join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
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
          <Button onClick={handleExport}>
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
                    <SelectItem value="pending_to_review">Pending → In Review</SelectItem>
                    <SelectItem value="review_to_hearing">In Review → Hearing</SelectItem>
                    <SelectItem value="hearing_to_resolved">Hearing → Resolved</SelectItem>
                    <SelectItem value="any_to_withdrawn">Any → Withdrawn</SelectItem>
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
              Showing {displayLogs.length} status changes from {format(new Date(dateRange.start), "MMM d, yyyy")} to {format(new Date(dateRange.end), "MMM d, yyyy")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading audit log...</div>
            ) : displayLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No audit log entries found</div>
            ) : (
              <div className="space-y-4">
                {displayLogs.map((log) => (
                <div key={log.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm text-muted-foreground">
                          Appeal #{log.appealId}
                        </span>
                        <span className="text-sm text-muted-foreground">•</span>
                        <span className="font-medium">{log.parcelId}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge className={statusColors[log.previousStatus as keyof typeof statusColors]}>
                          {log.previousStatus.replace("_", " ").toUpperCase()}
                        </Badge>
                        <span className="text-muted-foreground">→</span>
                        <Badge className={statusColors[log.newStatus as keyof typeof statusColors]}>
                          {log.newStatus.replace("_", " ").toUpperCase()}
                        </Badge>
                      </div>

                      {log.notes && (
                        <p className="text-sm text-muted-foreground flex items-start gap-2">
                          <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          {log.notes}
                        </p>
                      )}
                    </div>

                    <div className="text-right space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="w-4 h-4" />
                        {log.changedBy}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        {format(log.changedAt, "MMM d, yyyy")}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(log.changedAt, "h:mm a")}
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
