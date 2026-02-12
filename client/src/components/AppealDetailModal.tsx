import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";

interface AppealDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status: "pending" | "in_review" | "hearing_scheduled" | "resolved" | "withdrawn" | null;
}

const statusLabels: Record<string, string> = {
  pending: "Pending",
  in_review: "In Review",
  hearing_scheduled: "Hearing Scheduled",
  resolved: "Resolved",
  withdrawn: "Withdrawn",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
  in_review: "bg-blue-500/20 text-blue-500 border-blue-500/30",
  hearing_scheduled: "bg-purple-500/20 text-purple-500 border-purple-500/30",
  resolved: "bg-green-500/20 text-green-500 border-green-500/30",
  withdrawn: "bg-gray-500/20 text-gray-500 border-gray-500/30",
};

export function AppealDetailModal({ open, onOpenChange, status }: AppealDetailModalProps) {
  const { data: appeals, isLoading } = trpc.appeals.list.useQuery(
    { status: status || undefined },
    { enabled: open && !!status }
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {status && (
              <Badge className={statusColors[status]}>
                {statusLabels[status]}
              </Badge>
            )}
            Appeals ({appeals?.length || 0})
          </DialogTitle>
          <DialogDescription>
            Detailed list of appeals with {status ? statusLabels[status].toLowerCase() : "all"} status
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[500px] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              Loading appeals...
            </div>
          ) : appeals && appeals.length > 0 ? (
            <div className="space-y-3">
              {appeals.map((appeal) => (
                <div
                  key={appeal.id}
                  className="p-4 border border-border rounded-lg bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-mono text-sm text-[#00FFFF]">
                        {appeal.parcelId}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Filed: {new Date(appeal.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <Badge className={statusColors[appeal.status]}>
                      {statusLabels[appeal.status]}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                    <div>
                      <div className="text-muted-foreground">Assessed Value</div>
                      <div className="font-semibold">
                        ${appeal.currentAssessedValue?.toLocaleString() || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Appealed Value</div>
                      <div className="font-semibold">
                        ${appeal.appealedValue?.toLocaleString() || 'N/A'}
                      </div>
                    </div>
                  </div>
                  
                  {appeal.appealReason && (
                    <div className="mt-3 text-sm">
                      <div className="text-muted-foreground mb-1">Reason</div>
                      <div className="text-foreground/80">{appeal.appealReason}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              No appeals found
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
