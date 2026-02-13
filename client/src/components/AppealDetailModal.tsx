import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusHistoryTimeline } from "./StatusHistoryTimeline";
import { AppealComments } from "./AppealComments";
import { AppealDocuments } from "./AppealDocuments";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { 
  FileText, 
  DollarSign, 
  Calendar, 
  User, 
  MapPin, 
  CheckCircle2
} from "lucide-react";
import { toast } from "sonner";

interface AppealDetailModalProps {
  appealId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export function AppealDetailModal({ appealId, open, onOpenChange }: AppealDetailModalProps) {
  const { data: appeal, isLoading, refetch } = trpc.appeals.getById.useQuery(
    { id: appealId! },
    { enabled: !!appealId }
  );
  
  const updateMutation = trpc.appeals.update.useMutation({
    onSuccess: () => {
      toast.success("Appeal updated successfully");
      refetch();
    },
    onError: (error: any) => {
      toast.error(`Failed to update appeal: ${error.message}`);
    },
  });
  
  const handleStatusChange = (newStatus: string) => {
    if (!appealId) return;
    updateMutation.mutate({ id: appealId, status: newStatus as any });
  };
  
  const handleResolve = () => {
    if (!appealId) return;
    updateMutation.mutate({
      id: appealId,
      status: "resolved",
      resolutionDate: new Date().toISOString(),
    });
  };
  
  if (!appealId || !open) return null;
  
  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Loading appeal details...</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }
  
  if (!appeal) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Appeal not found</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl">Appeal Details</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Parcel ID: {appeal.parcelId}
              </p>
            </div>
            <Badge variant="outline" className={statusColors[appeal.status]}>
              {statusLabels[appeal.status]}
            </Badge>
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Select onValueChange={handleStatusChange} value={appeal.status}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Change status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_review">In Review</SelectItem>
                  <SelectItem value="hearing_scheduled">Hearing Scheduled</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="withdrawn">Withdrawn</SelectItem>
                </SelectContent>
              </Select>
              
              {appeal.status !== "resolved" && (
                <Button onClick={handleResolve} variant="default">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Mark as Resolved
                </Button>
              )}
              
              <Button variant="outline">
                <FileText className="w-4 h-4 mr-2" />
                Generate Report
              </Button>
            </CardContent>
          </Card>
          
          {/* Appeal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Appeal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">County:</span>
                    <span>{appeal.countyName}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Appeal Date:</span>
                    <span>{format(new Date(appeal.appealDate), "MMM d, yyyy")}</span>
                  </div>
                  
                  {appeal.hearingDate && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">Hearing Date:</span>
                      <span>{format(new Date(appeal.hearingDate), "MMM d, yyyy")}</span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Current Value:</span>
                    <span className="font-bold">${appeal.currentAssessedValue.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Appealed Value:</span>
                    <span className="font-bold text-blue-500">${appeal.appealedValue.toLocaleString()}</span>
                  </div>
                  
                  {appeal.finalValue && (
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">Final Value:</span>
                      <span className="font-bold text-green-500">${appeal.finalValue.toLocaleString()}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Parcel ID:</span>
                    <span>{appeal.parcelId}</span>
                  </div>
                </div>
              </div>
              
              {appeal.appealReason && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-1">Appeal Reason:</p>
                  <p className="text-sm text-muted-foreground">{appeal.appealReason}</p>
                </div>
              )}
              
              {appeal.resolution && (
                <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="text-sm font-medium mb-1 text-green-600">Resolution:</p>
                  <p className="text-sm">{appeal.resolution}</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Tabbed Content */}
          <Tabs defaultValue="history" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="history">Status History</TabsTrigger>
              <TabsTrigger value="comments">Comments</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>
            
            <TabsContent value="history" className="mt-4">
              <StatusHistoryTimeline appealId={appealId} />
            </TabsContent>
            
            <TabsContent value="comments" className="mt-4">
              <AppealComments appealId={appealId} />
            </TabsContent>
            
            <TabsContent value="documents" className="mt-4">
              <AppealDocuments appealId={appealId} />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
