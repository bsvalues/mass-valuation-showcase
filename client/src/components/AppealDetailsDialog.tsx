import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Calendar, Clock, FileText, Save, X, Edit2 } from "lucide-react";
import { format } from "date-fns";
import { AppealTimeline } from "@/components/AppealTimeline";

interface AppealDetailsDialogProps {
  appealId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: () => void;
}

export function AppealDetailsDialog({ appealId, open, onOpenChange, onUpdate }: AppealDetailsDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedReason, setEditedReason] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");
  
  // Fetch appeal details
  const { data: appeal, isLoading, refetch } = trpc.appeals.getById.useQuery(
    { id: appealId! },
    { enabled: !!appealId && open }
  );
  
  // Update appeal mutation
  const updateAppeal = trpc.appeals.update.useMutation({
    onSuccess: () => {
      toast.success("Appeal updated successfully");
      setIsEditing(false);
      refetch();
      onUpdate?.();
    },
    onError: (error) => {
      toast.error(`Failed to update appeal: ${error.message}`);
    }
  });
  
  // Initialize form values when appeal data loads
  useEffect(() => {
    if (appeal) {
      setEditedReason(appeal.appealReason || "");
      setResolutionNotes(appeal.resolution || "");
    }
  }, [appeal]);
  
  const handleSave = () => {
    if (!appealId) return;
    
    updateAppeal.mutate({
      id: appealId,
      appealReason: editedReason,
      resolution: resolutionNotes
    });
  };
  
  const handleCancel = () => {
    if (appeal) {
      setEditedReason(appeal.appealReason || "");
      setResolutionNotes(appeal.resolution || "");
    }
    setIsEditing(false);
  };
  
  if (!appeal && !isLoading) {
    return null;
  }
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'in_review': return 'bg-blue-500';
      case 'hearing_scheduled': return 'bg-purple-500';
      case 'resolved': return 'bg-green-500';
      case 'withdrawn': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };
  
  const getStatusLabel = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };
  
  const reductionAmount = appeal ? appeal.currentAssessedValue - appeal.appealedValue : 0;
  const reductionPercent = appeal ? ((reductionAmount / appeal.currentAssessedValue) * 100) : 0;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Appeal Details</span>
            {appeal && (
              <Badge className={getStatusColor(appeal.status)}>
                {getStatusLabel(appeal.status)}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            View and edit appeal information
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">
            Loading appeal details...
          </div>
        ) : appeal ? (
          <div className="space-y-6">
            {/* Property Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                Property Information
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-xs text-muted-foreground">Parcel ID</Label>
                  <p className="font-mono font-semibold">{appeal.parcelId}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Appeal Date</Label>
                  <p className="flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    {format(new Date(appeal.appealDate), 'MMM dd, yyyy')}
                  </p>
                </div>
              </div>
            </div>
            
            <Separator />
            
            {/* Valuation Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Valuation Details</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <Label className="text-xs text-muted-foreground">Current Value</Label>
                  <p className="text-lg font-bold">${appeal.currentAssessedValue.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <Label className="text-xs text-muted-foreground">Appealed Value</Label>
                  <p className="text-lg font-bold text-blue-500">${appeal.appealedValue.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <Label className="text-xs text-muted-foreground">Reduction</Label>
                  <p className="text-lg font-bold text-green-500">
                    ${reductionAmount.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ({reductionPercent.toFixed(1)}%)
                  </p>
                </div>
              </div>
            </div>
            
            <Separator />
            
            {/* Appeal Reason */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Appeal Reason</h3>
                {!isEditing && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit2 className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                )}
              </div>
              {isEditing ? (
                <Textarea
                  value={editedReason}
                  onChange={(e) => setEditedReason(e.target.value)}
                  placeholder="Enter appeal reason..."
                  rows={4}
                  className="resize-none"
                />
              ) : (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {appeal.appealReason || "No reason provided"}
                </p>
              )}
            </div>
            
            {/* Hearing Date */}
            {appeal.hearingDate && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    Hearing Scheduled
                  </h3>
                  <p className="text-sm">
                    {format(new Date(appeal.hearingDate), 'EEEE, MMMM dd, yyyy')}
                  </p>
                </div>
              </>
            )}
            
            {/* Resolution Notes */}
            {(appeal.status === 'resolved' || isEditing) && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold">Resolution Notes</h3>
                  {isEditing ? (
                    <Textarea
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      placeholder="Enter resolution notes..."
                      rows={4}
                      className="resize-none"
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {appeal.resolution || "No resolution notes"}
                    </p>
                  )}
                </div>
              </>
            )}
            
            {/* Timeline */}
            <Separator />
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Timeline</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-500"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Appeal Created</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(appeal.createdAt), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                </div>
                {appeal.updatedAt && appeal.updatedAt !== appeal.createdAt && (
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 mt-1.5 rounded-full bg-yellow-500"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Last Updated</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(appeal.updatedAt), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                )}
                {appeal.status === 'resolved' && (
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 mt-1.5 rounded-full bg-green-500"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Resolved</p>
                      <p className="text-xs text-muted-foreground">
                        Status: {getStatusLabel(appeal.status)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Appeal Timeline */}
            {!isEditing && appeal && (
              <div className="pt-6 border-t">
                <AppealTimeline appealId={appeal.id} />
              </div>
            )}
            
            {/* Action Buttons */}
            {isEditing && (
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={updateAppeal.isPending}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={updateAppeal.isPending}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {updateAppeal.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
