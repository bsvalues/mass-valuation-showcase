import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { DndContext, DragEndEvent, DragOverlay, PointerSensor, useSensor, useSensors, useDroppable, useDraggable } from "@dnd-kit/core";
import { useState } from "react";
import { toast } from "sonner";
import { FileText, Calendar, DollarSign, MapPin, Plus } from "lucide-react";
import { AppealCreateDialog } from "@/components/AppealCreateDialog";

type AppealStatus = "pending" | "in_review" | "hearing_scheduled" | "resolved" | "withdrawn";

interface Appeal {
  id: number;
  parcelId: string;
  appealDate: Date;
  currentAssessedValue: number;
  appealedValue: number;
  finalValue: number | null;
  status: AppealStatus;
  appealReason: string | null;
  resolution: string | null;
  countyName: string | null;
  hearingDate: Date | null;
  createdAt: Date;
}

const statusConfig: Record<AppealStatus, { label: string; color: string; bgColor: string }> = {
  pending: { label: "Pending", color: "text-amber-600", bgColor: "bg-amber-50 border-amber-200" },
  in_review: { label: "In Review", color: "text-blue-600", bgColor: "bg-blue-50 border-blue-200" },
  hearing_scheduled: { label: "Hearing Scheduled", color: "text-purple-600", bgColor: "bg-purple-50 border-purple-200" },
  resolved: { label: "Resolved", color: "text-green-600", bgColor: "bg-green-50 border-green-200" },
  withdrawn: { label: "Withdrawn", color: "text-gray-600", bgColor: "bg-gray-50 border-gray-200" },
};

function DraggableAppealCard({ appeal }: { appeal: Appeal }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: appeal.id.toString(),
  });
  
  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.5 : 1,
  } : undefined;
  
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <AppealCard appeal={appeal} />
    </div>
  );
}

function AppealCard({ appeal }: { appeal: Appeal }) {
  const config = statusConfig[appeal.status];
  const valueDifference = appeal.currentAssessedValue - appeal.appealedValue;
  const percentageChange = (valueDifference / appeal.currentAssessedValue) * 100;
  
  return (
    <Card className={`${config.bgColor} border-2 cursor-move hover:shadow-md transition-shadow`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="font-mono text-sm font-semibold">{appeal.parcelId}</span>
            </div>
            {appeal.countyName && (
              <p className="text-xs text-muted-foreground">{appeal.countyName}</p>
            )}
          </div>
          <Badge variant="outline" className={config.color}>
            {config.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Current Value</p>
            <p className="font-semibold">${appeal.currentAssessedValue.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Appealed Value</p>
            <p className="font-semibold text-blue-600">${appeal.appealedValue.toLocaleString()}</p>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-xs pt-2 border-t">
          <div className="flex items-center gap-1 text-muted-foreground">
            <DollarSign className="w-3 h-3" />
            <span className={valueDifference > 0 ? "text-red-600" : "text-green-600"}>
              {valueDifference > 0 ? "-" : "+"}${Math.abs(valueDifference).toLocaleString()} ({Math.abs(percentageChange).toFixed(1)}%)
            </span>
          </div>
          {appeal.hearingDate && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="w-3 h-3" />
              <span>{new Date(appeal.hearingDate).toLocaleDateString()}</span>
            </div>
          )}
        </div>
        
        {appeal.appealReason && (
          <p className="text-xs text-muted-foreground line-clamp-2 pt-2 border-t">
            {appeal.appealReason}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function DroppableColumn({ status, appeals }: { status: AppealStatus; appeals: Appeal[] }) {
  const { setNodeRef } = useDroppable({
    id: status,
  });
  
  const config = statusConfig[status];
  
  return (
    <div className="flex-1 min-w-[280px]">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm">{config.label}</h3>
          <Badge variant="secondary" className="text-xs">
            {appeals.length}
          </Badge>
        </div>
        <div className="h-1 rounded-full bg-muted">
          <div className={`h-full rounded-full ${config.bgColor.split(' ')[0]}`} style={{ width: `${Math.min((appeals.length / 10) * 100, 100)}%` }} />
        </div>
      </div>
      
      <div ref={setNodeRef} className="space-y-3 min-h-[400px] p-3 rounded-lg bg-muted/30">
        {appeals.map((appeal) => (
          <DraggableAppealCard key={appeal.id} appeal={appeal} />
        ))}
        {appeals.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <FileText className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">No appeals</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AppealsManagement() {
  const [activeId, setActiveId] = useState<number | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  
  // Query all appeals
  const { data: appeals = [], refetch } = trpc.appeals.list.useQuery();
  
  // Update status mutation
  const updateStatus = trpc.appeals.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Appeal status updated");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to update status: ${error.message}`);
    },
  });
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );
  
  const handleDragStart = (event: any) => {
    const appealId = parseInt(event.active.id);
    setActiveId(appealId);
  };
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    
    if (!over) return;
    
    const appealId = parseInt(active.id as string);
    const newStatus = over.id as AppealStatus;
    
    const appeal = appeals.find(a => a.id === appealId);
    if (!appeal || appeal.status === newStatus) return;
    
    updateStatus.mutate({
      id: appealId,
      status: newStatus,
    });
  };
  
  const handleDragCancel = () => {
    setActiveId(null);
  };
  
  // Group appeals by status
  const appealsByStatus: Record<AppealStatus, Appeal[]> = {
    pending: [],
    in_review: [],
    hearing_scheduled: [],
    resolved: [],
    withdrawn: [],
  };
  
  appeals.forEach((appeal) => {
    appealsByStatus[appeal.status as AppealStatus].push(appeal as Appeal);
  });
  
  const activeAppeal = activeId ? appeals.find(a => a.id === activeId) : null;
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Appeals Management</h1>
            <p className="text-muted-foreground mt-1">
              Track and manage property tax appeals with drag-and-drop workflow
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Appeal
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {(Object.keys(statusConfig) as AppealStatus[]).map((status) => {
            const config = statusConfig[status];
            const count = appealsByStatus[status].length;
            return (
              <Card key={status}>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{count}</div>
                  <p className="text-xs text-muted-foreground mt-1">{config.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Kanban Board */}
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="flex gap-4 overflow-x-auto pb-4">
            {(Object.keys(statusConfig) as AppealStatus[]).map((status) => (
              <div key={status} id={status} className="flex-1 min-w-[280px]">
                <DroppableColumn status={status} appeals={appealsByStatus[status]} />
              </div>
            ))}
          </div>
          
          <DragOverlay>
            {activeAppeal ? <AppealCard appeal={activeAppeal as Appeal} /> : null}
          </DragOverlay>
        </DndContext>
        
        <AppealCreateDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSuccess={refetch}
        />
      </div>
    </DashboardLayout>
  );
}
