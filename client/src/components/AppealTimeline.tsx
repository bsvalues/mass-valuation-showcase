import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, FileText, MessageSquare, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

interface AppealTimelineProps {
  appealId: number;
}

type TimelineEvent = {
  id: string;
  type: "status_change" | "document_upload" | "comment";
  timestamp: Date;
  title: string;
  description: string;
  metadata?: any;
};

export function AppealTimeline({ appealId }: AppealTimelineProps) {
  // Fetch all data sources
  const { data: appeal, isLoading: loadingAppeal } = trpc.appeals.getById.useQuery({ id: appealId });
  const { data: documents, isLoading: loadingDocs } = trpc.appeals.getDocuments.useQuery({ appealId });
  const { data: comments, isLoading: loadingComments } = trpc.appeals.getComments.useQuery({ appealId });

  const isLoading = loadingAppeal || loadingDocs || loadingComments;

  // Merge and sort all timeline events
  const timelineEvents: TimelineEvent[] = [];

  // Add appeal creation event
  if (appeal) {
    timelineEvents.push({
      id: `appeal-created-${appeal.id}`,
      type: "status_change",
      timestamp: new Date(appeal.createdAt),
      title: "Appeal Created",
      description: `Appeal submitted for parcel ${appeal.parcelId}`,
      metadata: { status: "pending" },
    });

    // Add status change event if resolved
    if (appeal.resolutionDate) {
      timelineEvents.push({
        id: `appeal-resolved-${appeal.id}`,
        type: "status_change",
        timestamp: new Date(appeal.resolutionDate),
        title: "Appeal Resolved",
        description: `Status changed to ${appeal.status}`,
        metadata: { status: appeal.status },
      });
    }
  }

  // Add document upload events
  if (documents) {
    documents.forEach((doc: any) => {
      timelineEvents.push({
        id: `document-${doc.id}`,
        type: "document_upload",
        timestamp: new Date(doc.createdAt),
        title: "Document Uploaded",
        description: doc.fileName,
        metadata: { fileType: doc.fileType, fileSize: doc.fileSize },
      });
    });
  }

  // Add comment events (only owner communications, not internal notes)
  if (comments) {
    comments.forEach((comment: any) => {
      if (comment.commentType === "owner_communication") {
        timelineEvents.push({
          id: `comment-${comment.id}`,
          type: "comment",
          timestamp: new Date(comment.createdAt),
          title: "Communication Added",
          description: comment.content.substring(0, 100) + (comment.content.length > 100 ? "..." : ""),
          metadata: { authorName: comment.authorName },
        });
      }
    });
  }

  // Sort by timestamp (most recent first)
  timelineEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  const getEventIcon = (type: TimelineEvent["type"]) => {
    switch (type) {
      case "status_change":
        return <CheckCircle2 className="w-4 h-4" />;
      case "document_upload":
        return <FileText className="w-4 h-4" />;
      case "comment":
        return <MessageSquare className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getEventColor = (type: TimelineEvent["type"]) => {
    switch (type) {
      case "status_change":
        return "bg-green-500";
      case "document_upload":
        return "bg-blue-500";
      case "comment":
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Activity Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {!isLoading && timelineEvents.length === 0 && (
          <div className="text-center text-muted-foreground py-12">
            No activity yet for this appeal.
          </div>
        )}

        {!isLoading && timelineEvents.length > 0 && (
          <div className="relative">
            {/* Vertical timeline line */}
            <div className="absolute left-[15px] top-0 bottom-0 w-[2px] bg-border" />

            {/* Timeline events */}
            <div className="space-y-6">
              {timelineEvents.map((event, index) => (
                <div key={event.id} className="relative pl-10">
                  {/* Event icon */}
                  <div
                    className={`absolute left-0 w-8 h-8 rounded-full ${getEventColor(event.type)} flex items-center justify-center text-white z-10`}
                  >
                    {getEventIcon(event.type)}
                  </div>

                  {/* Event content */}
                  <div className="border rounded-lg p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-sm">{event.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(event.timestamp, "MMM d, yyyy 'at' h:mm a")}
                          {" • "}
                          {formatDistanceToNow(event.timestamp, { addSuffix: true })}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {event.type.replace("_", " ")}
                      </Badge>
                    </div>

                    <p className="text-sm text-foreground">{event.description}</p>

                    {/* Additional metadata */}
                    {event.metadata && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        {event.type === "document_upload" && (
                          <span>
                            {event.metadata.fileType} • {formatFileSize(event.metadata.fileSize)}
                          </span>
                        )}
                        {event.type === "comment" && event.metadata.authorName && (
                          <span>By {event.metadata.authorName}</span>
                        )}
                        {event.type === "status_change" && event.metadata.status && (
                          <Badge variant="secondary" className="text-xs">
                            {event.metadata.status}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
