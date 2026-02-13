import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, User, ArrowRight } from "lucide-react";
import { format } from "date-fns";

interface StatusHistoryTimelineProps {
  appealId: number;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  in_review: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  hearing_scheduled: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  resolved: "bg-green-500/10 text-green-500 border-green-500/20",
  withdrawn: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  in_review: "In Review",
  hearing_scheduled: "Hearing Scheduled",
  resolved: "Resolved",
  withdrawn: "Withdrawn",
};

export function StatusHistoryTimeline({ appealId }: StatusHistoryTimelineProps) {
  const { data: history, isLoading } = trpc.appeals.getStatusHistory.useQuery({ appealId });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Status Change History</CardTitle>
          <CardDescription>Loading audit trail...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!history || history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Status Change History</CardTitle>
          <CardDescription>No status changes recorded yet</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status Change History</CardTitle>
        <CardDescription>Complete audit trail of all status transitions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {history.map((entry, index) => (
            <div
              key={entry.id}
              className="flex items-start gap-4 pb-4 border-b border-border last:border-0 last:pb-0"
            >
              {/* Timeline connector */}
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-primary" />
                {index < history.length - 1 && (
                  <div className="w-0.5 h-full min-h-[40px] bg-border mt-2" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 space-y-2">
                {/* Action description */}
                <div className="flex items-center gap-2 flex-wrap">
                  {entry.previousStatus && (
                    <Badge variant="outline" className={statusColors[entry.previousStatus]}>
                      {statusLabels[entry.previousStatus]}
                    </Badge>
                  )}
                  {entry.previousStatus && entry.newStatus && (
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  )}
                  <Badge variant="outline" className={statusColors[entry.newStatus]}>
                    {statusLabels[entry.newStatus]}
                  </Badge>
                </div>

                {/* Action text */}
                <p className="text-sm font-medium">{entry.action}</p>

                {/* Notes if any */}
                {entry.notes && (
                  <p className="text-sm text-muted-foreground italic">{entry.notes}</p>
                )}

                {/* Metadata */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {format(new Date(entry.createdAt), "MMM d, yyyy 'at' h:mm a")}
                  </div>
                  {entry.performedBy && (
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      User ID: {entry.performedBy}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
