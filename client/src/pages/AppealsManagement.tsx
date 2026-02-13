import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { DndContext, DragEndEvent, DragOverlay, PointerSensor, useSensor, useSensors, useDroppable, useDraggable } from "@dnd-kit/core";
import { useState } from "react";
import { toast } from "sonner";
import { FileText, Calendar, DollarSign, MapPin, Plus, Download, ClipboardList, Scale } from "lucide-react";
import { useLocation } from "wouter";
import { AppealCreateDialog } from "@/components/AppealCreateDialog";
import { AppealDetailsDialog } from "@/components/AppealDetailsDialog";
import { BulkAppealImport } from "@/components/BulkAppealImport";
import { getPriorityLabel, getPriorityColor, type Priority } from "@/lib/priorityUtils";

type AppealStatus = "pending" | "in_review" | "hearing_scheduled" | "resolved" | "withdrawn";

interface Appeal {
  id: number;
  parcelId: string;
  appealDate: Date;
  currentAssessedValue: number;
  appealedValue: number;
  finalValue: number | null;
  status: AppealStatus;
  priority: Priority;
  appealReason: string | null;
  resolution: string | null;
  countyName: string | null;
  assignedTo: number | null;
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

function DraggableAppealCard({ appeal, onClick, selectable, selected, onSelect, onAssign, staffList }: { 
  appeal: Appeal; 
  onClick?: () => void;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (id: number) => void;
  onAssign?: (appealId: number, assignedTo: number | null) => void;
  staffList?: Array<{ id: number; name: string | null; email: string | null }>;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: appeal.id.toString(),
  });
  
  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.5 : 1,
  } : undefined;
  
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="relative">
      {selectable && (
        <div className="absolute top-2 right-2 z-10">
          <input 
            type="checkbox" 
            checked={selected} 
            onChange={() => onSelect?.(appeal.id)}
            className="w-4 h-4 cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
      <div className={selected ? "ring-2 ring-primary rounded-lg" : ""}>
        <AppealCard appeal={appeal} onClick={onClick} onAssign={onAssign} staffList={staffList} />
      </div>
    </div>
  );
}

function AppealCard({ appeal, onClick, onAssign, staffList }: { 
  appeal: Appeal; 
  onClick?: () => void;
  onAssign?: (appealId: number, assignedTo: number | null) => void;
  staffList?: Array<{ id: number; name: string | null; email: string | null }>;
}) {
  const config = statusConfig[appeal.status];
  const valueDifference = appeal.currentAssessedValue - appeal.appealedValue;
  const percentageChange = (valueDifference / appeal.currentAssessedValue) * 100;
  
  return (
    <Card 
      className={`${config.bgColor} border-2 cursor-pointer hover:shadow-md transition-shadow`}
      onClick={onClick}
    >
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
          <div className="flex flex-col gap-1 items-end">
            <Badge variant="outline" className={config.color}>
              {config.label}
            </Badge>
            <Badge variant="outline" className={getPriorityColor(appeal.priority)}>
              {getPriorityLabel(appeal.priority)}
            </Badge>
          </div>
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
        
        {/* Assignment Dropdown */}
        {staffList && onAssign && (
          <div className="pt-2 border-t" onClick={(e) => e.stopPropagation()}>
            <select
              value={appeal.assignedTo || ""}
              onChange={(e) => {
                const value = e.target.value;
                onAssign(appeal.id, value ? parseInt(value) : null);
              }}
              className="w-full text-xs border rounded px-2 py-1 bg-background"
            >
              <option value="">Unassigned</option>
              {staffList.map((staff) => (
                <option key={staff.id} value={staff.id}>
                  {staff.name || `User #${staff.id}`}
                </option>
              ))}
            </select>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DroppableColumn({ status, appeals, onAppealClick, selectable, selectedAppeals, onToggleSelect, onAssign, staffList }: { 
  status: AppealStatus; 
  appeals: Appeal[]; 
  onAppealClick?: (appealId: number) => void;
  selectable?: boolean;
  selectedAppeals?: Set<number>;
  onToggleSelect?: (id: number) => void;
  onAssign?: (appealId: number, assignedTo: number | null) => void;
  staffList?: Array<{ id: number; name: string | null; email: string | null }>;
}) {
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
            <DraggableAppealCard 
              key={appeal.id} 
              appeal={appeal} 
              onClick={() => selectable ? onToggleSelect?.(appeal.id) : onAppealClick?.(appeal.id)}
              selectable={selectable}
              selected={selectedAppeals?.has(appeal.id)}
              onSelect={onToggleSelect}
              onAssign={onAssign}
              staffList={staffList}
            />
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
  const [, setLocation] = useLocation();
  const [activeId, setActiveId] = useState<number | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedAppealId, setSelectedAppealId] = useState<number | null>(null);
  const [selectedAppeals, setSelectedAppeals] = useState<Set<number>>(new Set());
  const [bulkUpdateMode, setBulkUpdateMode] = useState(false);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCounty, setFilterCounty] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<AppealStatus | "">("");
  const [filterPriority, setFilterPriority] = useState<Priority | "">("");
  const [filterValueMin, setFilterValueMin] = useState<string>("");
  const [filterValueMax, setFilterValueMax] = useState<string>("");
  const [filterDateFrom, setFilterDateFrom] = useState<string>("");
  const [filterDateTo, setFilterDateTo] = useState<string>("");
  
  const handleAppealClick = (appealId: number) => {
    setSelectedAppealId(appealId);
    setDetailsDialogOpen(true);
  };
  
  // Query all appeals and staff list
  const { data: appeals = [], refetch } = trpc.appeals.list.useQuery();
  const { data: staffList = [] } = trpc.appeals.getStaffList.useQuery();
  
  // Assignment mutation
  const assignAppeal = trpc.appeals.assignAppeal.useMutation({
    onSuccess: () => {
      toast.success("Appeal assigned successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to assign appeal: ${error.message}`);
    },
  });

  // Bulk update status mutation
  const bulkUpdateStatus = trpc.appeals.bulkUpdateStatus.useMutation({
    onSuccess: (data) => {
      toast.success(`Updated ${data.updated} appeals successfully`);
      setSelectedAppeals(new Set());
      setBulkUpdateMode(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to bulk update: ${error.message}`);
    },
  });

  // Bulk assign mutation
  const bulkAssign = trpc.appeals.bulkAssign.useMutation({
    onSuccess: (data) => {
      toast.success(`Assigned ${data.updated} appeals successfully`);
      setSelectedAppeals(new Set());
      setBulkUpdateMode(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to bulk assign: ${error.message}`);
    },
  });

  // Batch export query
  const { refetch: exportAppeals } = trpc.appeals.batchExport.useQuery(
    { appealIds: Array.from(selectedAppeals) },
    { enabled: false }
  );

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
  
  // Apply client-side filters
  const filteredAppeals = appeals.filter((appeal) => {
    // Search query (parcel ID or county)
    if (searchQuery && !appeal.parcelId.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !(appeal.countyName?.toLowerCase().includes(searchQuery.toLowerCase()))) {
      return false;
    }
    
    // County filter
    if (filterCounty && appeal.countyName !== filterCounty) {
      return false;
    }
    
    // Status filter
    if (filterStatus && appeal.status !== filterStatus) {
      return false;
    }
    
    // Priority filter
    if (filterPriority && appeal.priority !== filterPriority) {
      return false;
    }
    
    // Value range filter
    if (filterValueMin && appeal.currentAssessedValue < parseInt(filterValueMin)) {
      return false;
    }
    if (filterValueMax && appeal.currentAssessedValue > parseInt(filterValueMax)) {
      return false;
    }
    
    // Date range filter
    if (filterDateFrom && new Date(appeal.appealDate) < new Date(filterDateFrom)) {
      return false;
    }
    if (filterDateTo && new Date(appeal.appealDate) > new Date(filterDateTo)) {
      return false;
    }
    
    return true;
  });
  
  // Get unique counties for filter dropdown
  const uniqueCounties = Array.from(new Set(appeals.map(a => a.countyName).filter(Boolean)));
  
  // Group filtered appeals by status
  const appealsByStatus: Record<AppealStatus, Appeal[]> = {
    pending: [],
    in_review: [],
    hearing_scheduled: [],
    resolved: [],
    withdrawn: [],
  };
  
  filteredAppeals.forEach((appeal) => {
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
          <div className="flex gap-2">
            {bulkUpdateMode && selectedAppeals.size > 0 && (
              <>
                <select
                  className="border rounded px-3 py-2"
                  onChange={(e) => {
                    if (e.target.value) {
                      bulkUpdateStatus.mutate({
                        appealIds: Array.from(selectedAppeals),
                        status: e.target.value as any,
                      });
                      e.target.value = "";
                    }
                  }}
                >
                  <option value="">Update {selectedAppeals.size} appeals...</option>
                  <option value="pending">Set to Pending</option>
                  <option value="in_review">Set to In Review</option>
                  <option value="hearing_scheduled">Set to Hearing Scheduled</option>
                  <option value="resolved">Set to Resolved</option>
                  <option value="withdrawn">Set to Withdrawn</option>
                </select>
                <Button
                  variant="outline"
                  onClick={() => {
                    const selectedAppealsList = appeals.filter(a => selectedAppeals.has(a.id));
                    const headers = "Parcel ID,Appeal Date,Current Value,Appealed Value,Status,Reason";
                    const rows = selectedAppealsList.map(appeal => 
                      `"${appeal.parcelId}","${new Date(appeal.appealDate).toLocaleDateString()}",${appeal.currentAssessedValue},${appeal.appealedValue},"${appeal.status}","${appeal.appealReason || ''}"`
                    );
                    const csv = [headers, ...rows].join('\n');
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `selected_appeals_${new Date().toISOString().split('T')[0]}.csv`;
                    a.click();
                    URL.revokeObjectURL(url);
                    toast.success(`Exported ${selectedAppeals.size} selected appeals`);
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Selected
                </Button>
                <Button
                  variant="outline"
                  onClick={async () => {
                    toast.info("Bulk document download coming soon - requires ZIP library integration");
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Docs
                </Button>
              </>
            )}
            <Button 
              variant={bulkUpdateMode ? "default" : "outline"}
              onClick={() => {
                setBulkUpdateMode(!bulkUpdateMode);
                setSelectedAppeals(new Set());
              }}
            >
              {bulkUpdateMode ? "Cancel Bulk Update" : "Bulk Update"}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setLocation("/appeals/comparison")}
            >
              <Scale className="w-4 h-4 mr-2" />
              Compare
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setLocation("/appeals/audit-log")}
            >
              <ClipboardList className="w-4 h-4 mr-2" />
              Audit Log
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                if (appeals.length === 0) {
                  toast.error("No appeals to export");
                  return;
                }
                
                // Generate CSV content
                const headers = "Parcel ID,Appeal Date,Current Value,Appealed Value,Status,Reason";
                const rows = appeals.map(appeal => 
                  `"${appeal.parcelId}","${new Date(appeal.appealDate).toLocaleDateString()}",${appeal.currentAssessedValue},${appeal.appealedValue},"${appeal.status}","${appeal.appealReason || ''}"`
                );
                const csv = [headers, ...rows].join('\n');
                
                // Trigger download
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `appeals_export_${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
                URL.revokeObjectURL(url);
                
                toast.success(`Exported ${appeals.length} appeals to CSV`);
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              Export to CSV
            </Button>
            <Button 
              variant={bulkUpdateMode ? "default" : "outline"}
              onClick={() => {
                setBulkUpdateMode(!bulkUpdateMode);
                if (bulkUpdateMode) {
                  setSelectedAppeals(new Set());
                }
              }}
            >
              {bulkUpdateMode ? "Cancel Batch Mode" : "Batch Actions"}
            </Button>
            <Button variant="outline" onClick={() => setBulkImportOpen(true)}>
              <FileText className="w-4 h-4 mr-2" />
              Bulk Import
            </Button>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Appeal
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Search */}
              <div className="lg:col-span-2">
                <input
                  type="text"
                  placeholder="Search by Parcel ID or County..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                />
              </div>
              
              {/* County Filter */}
              <select
                value={filterCounty}
                onChange={(e) => setFilterCounty(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm bg-background"
              >
                <option value="">All Counties</option>
                {uniqueCounties.map((county) => (
                  <option key={county} value={county || ""}>
                    {county}
                  </option>
                ))}
              </select>
              
              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as AppealStatus | "")}
                className="px-3 py-2 border rounded-md text-sm bg-background"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="in_review">In Review</option>
                <option value="hearing_scheduled">Hearing Scheduled</option>
                <option value="resolved">Resolved</option>
                <option value="withdrawn">Withdrawn</option>
              </select>
              
              {/* Priority Filter */}
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value as Priority | "")}
                className="px-3 py-2 border rounded-md text-sm bg-background"
              >
                <option value="">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              {/* Value Range */}
              <input
                type="number"
                placeholder="Min Value"
                value={filterValueMin}
                onChange={(e) => setFilterValueMin(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              />
              <input
                type="number"
                placeholder="Max Value"
                value={filterValueMax}
                onChange={(e) => setFilterValueMax(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              />
              
              {/* Date Range */}
              <input
                type="date"
                placeholder="From Date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              />
              <input
                type="date"
                placeholder="To Date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              />
            </div>
            
            {/* Reset Button */}
            {(searchQuery || filterCounty || filterStatus || filterValueMin || filterValueMax || filterDateFrom || filterDateTo) && (
              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setFilterCounty("");
                    setFilterStatus("");
                    setFilterValueMin("");
                    setFilterValueMax("");
                    setFilterDateFrom("");
                    setFilterDateTo("");
                    toast.success("Filters reset");
                  }}
                >
                  Reset Filters
                </Button>
                <span className="ml-3 text-sm text-muted-foreground">
                  Showing {filteredAppeals.length} of {appeals.length} appeals
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Batch Actions Toolbar */}
        {bulkUpdateMode && selectedAppeals.size > 0 && (
          <Card className="bg-primary/5 border-primary">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">
                  {selectedAppeals.size} appeal{selectedAppeals.size > 1 ? 's' : ''} selected
                </div>
                <div className="flex gap-2">
                  <select
                    className="px-3 py-2 border rounded-md text-sm bg-background"
                    onChange={(e) => {
                      if (!e.target.value) return;
                      if (confirm(`Update ${selectedAppeals.size} appeals to ${e.target.value}?`)) {
                        bulkUpdateStatus.mutate({
                          appealIds: Array.from(selectedAppeals),
                          status: e.target.value as AppealStatus,
                        });
                      }
                      e.target.value = "";
                    }}
                    defaultValue=""
                  >
                    <option value="">Update Status...</option>
                    <option value="pending">Pending</option>
                    <option value="in_review">In Review</option>
                    <option value="hearing_scheduled">Hearing Scheduled</option>
                    <option value="resolved">Resolved</option>
                    <option value="withdrawn">Withdrawn</option>
                  </select>
                  <select
                    className="px-3 py-2 border rounded-md text-sm bg-background"
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "") return;
                      if (confirm(`Assign ${selectedAppeals.size} appeals to ${staffList.find(s => s.id === parseInt(value))?.name || 'staff member'}?`)) {
                        bulkAssign.mutate({
                          appealIds: Array.from(selectedAppeals),
                          assignedTo: value === "unassign" ? null : parseInt(value),
                        });
                      }
                      e.target.value = "";
                    }}
                    defaultValue=""
                  >
                    <option value="">Assign To...</option>
                    <option value="unassign">Unassign</option>
                    {staffList.map(staff => (
                      <option key={staff.id} value={staff.id}>
                        {staff.name || staff.email || `User #${staff.id}`}
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      const result = await exportAppeals();
                      if (result.data) {
                        const headers = Object.keys(result.data[0]).join(',');
                        const rows = result.data.map(row => Object.values(row).map(v => `"${v}"`).join(','));
                        const csv = [headers, ...rows].join('\n');
                        const blob = new Blob([csv], { type: 'text/csv' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `selected_appeals_${new Date().toISOString().split('T')[0]}.csv`;
                        a.click();
                        URL.revokeObjectURL(url);
                        toast.success(`Exported ${selectedAppeals.size} appeals`);
                      }
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export Selected
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedAppeals(new Set());
                      toast.info("Selection cleared");
                    }}
                  >
                    Clear Selection
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
                <DroppableColumn 
                  status={status} 
                  appeals={appealsByStatus[status]} 
                  onAppealClick={handleAppealClick}
                  selectable={bulkUpdateMode}
                  selectedAppeals={selectedAppeals}
                  onToggleSelect={(id) => {
                    const newSelected = new Set(selectedAppeals);
                    if (newSelected.has(id)) {
                      newSelected.delete(id);
                    } else {
                      newSelected.add(id);
                    }
                    setSelectedAppeals(newSelected);
                  }}
                  onAssign={(appealId, assignedTo) => {
                    assignAppeal.mutate({ appealId, assignedTo });
                  }}
                  staffList={staffList}
                />
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
        
        <AppealDetailsDialog
          appealId={selectedAppealId}
          open={detailsDialogOpen}
          onOpenChange={setDetailsDialogOpen}
          onUpdate={refetch}
        />
        
        <BulkAppealImport
          open={bulkImportOpen}
          onOpenChange={setBulkImportOpen}
          onSuccess={refetch}
        />
      </div>
    </DashboardLayout>
  );
}
