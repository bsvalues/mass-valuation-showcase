import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, User, FileText } from "lucide-react";
import { format } from "date-fns";

interface AppealTimelineProps {
  appealId: number;
}

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  in_review: "bg-blue-100 text-blue-800",
  hearing_scheduled: "bg-purple-100 text-purple-800",
  resolved: "bg-green-100 text-green-800",
  withdrawn: "bg-gray-100 text-gray-800",
};

export function AppealTimeline({ appealId }: AppealTimelineProps) {
  const { data: timeline, isLoading } = trpc.appeals.getTimeline.useQuery({ appealId });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Appeal Timeline</CardTitle>
          <CardDescription>Loading timeline...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!timeline || timeline.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Appeal Timeline</CardTitle>
          <CardDescription>No timeline events recorded</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Appeal Timeline</CardTitle>
        <CardDescription>Status changes and actions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {timeline.map((event: any, index: number) => (
            <div key={event.id} className="flex gap-4 relative">
              {/* Timeline line */}
              {index < timeline.length - 1 && (
                <div className="absolute left-[15px] top-8 bottom-0 w-[2px] bg-border" />
              )}

              {/* Timeline dot */}
              <div className="relative flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center">
                  <Clock className="w-4 h-4 text-primary" />
                </div>
              </div>

              {/* Event content */}
              <div className="flex-1 pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{event.action}</span>
                      {event.newStatus && (
                        <Badge className={statusColors[event.newStatus as keyof typeof statusColors]}>
                          {event.newStatus.replace("_", " ").toUpperCase()}
                        </Badge>
                      )}
                    </div>
                    {event.notes && (
                      <p className="text-sm text-muted-foreground flex items-start gap-2">
                        <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        {event.notes}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(event.createdAt), "MMM d, yyyy 'at' h:mm a")}
                      </span>
                      {event.performedBy && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          User #{event.performedBy}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
