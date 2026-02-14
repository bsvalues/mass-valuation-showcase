import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { AlertTriangle, ArrowUpDown, ExternalLink, Filter, Loader2, CheckSquare, Square } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { PropertyPreviewCard } from "@/components/PropertyPreviewCard";

interface HighVarianceProperty {
  id: string;
  parcelId: string;
  address: string;
  assessedValue: number;
  salePrice: number;
  ratio: number;
  clusterMedianRatio: number;
  variancePercent: number;
  severity: "warning" | "critical";
  clusterId: number;
  lastReviewDate?: string;
  status: "pending" | "approved" | "flagged";
}

export default function AssessmentReview() {
  const [, setLocation] = useLocation();
  const [sortBy, setSortBy] = useState<string>("variancePercent");
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [hoveredProperty, setHoveredProperty] = useState<HighVarianceProperty | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const utils = trpc.useUtils();
  
  // Bulk update mutation
  const bulkUpdate = trpc.assessmentReview.bulkUpdateStatus.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setSelectedIds(new Set());
      utils.assessmentReview.getHighVarianceProperties.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update properties");
    },
  });

  // Fetch high-variance properties using tRPC
  const { data: highVarianceData, isLoading } = trpc.assessmentReview.getHighVarianceProperties.useQuery({
    minVariancePercent: 15,
    limit: 100,
    offset: 0,
    severity: filterSeverity as "all" | "warning" | "critical",
    status: filterStatus as "all" | "pending" | "approved" | "flagged",
  });

  // Use real data from tRPC
  const properties: HighVarianceProperty[] = (highVarianceData || []).map(p => ({
    id: p.id.toString(),
    parcelId: p.parcelId,
    address: p.address || "Unknown",
    assessedValue: p.assessedValue || 0,
    salePrice: p.salePrice || 0,
    ratio: p.ratio,
    clusterMedianRatio: p.clusterMedianRatio,
    variancePercent: p.variancePercent,
    severity: p.severity,
    clusterId: p.clusterId || 0,
    lastReviewDate: p.lastReviewDate || undefined,
    status: p.status,
  }));

  // Apply sorting
  const sortedProperties = [...properties].sort((a, b) => {
    if (sortBy === "variancePercent") {
      return Math.abs(b.variancePercent) - Math.abs(a.variancePercent);
    }
    return 0;
  });

  // Calculate summary stats
  const totalProperties = properties.length;
  const criticalCount = properties.filter(p => p.severity === "critical").length;
  const warningCount = properties.filter(p => p.severity === "warning").length;
  const pendingCount = properties.filter(p => p.status === "pending").length;

  // Variance distribution data for chart
  const varianceDistribution = [
    { range: "0-5%", count: properties.filter(p => Math.abs(p.variancePercent) <= 5).length },
    { range: "5-10%", count: properties.filter(p => Math.abs(p.variancePercent) > 5 && Math.abs(p.variancePercent) <= 10).length },
    { range: "10-15%", count: properties.filter(p => Math.abs(p.variancePercent) > 10 && Math.abs(p.variancePercent) <= 15).length },
    { range: "15-20%", count: properties.filter(p => Math.abs(p.variancePercent) > 15 && Math.abs(p.variancePercent) <= 20).length },
    { range: "20-25%", count: properties.filter(p => Math.abs(p.variancePercent) > 20 && Math.abs(p.variancePercent) <= 25).length },
    { range: "25-30%", count: properties.filter(p => Math.abs(p.variancePercent) > 25 && Math.abs(p.variancePercent) <= 30).length },
    { range: ">30%", count: properties.filter(p => Math.abs(p.variancePercent) > 30).length },
  ];

  // Bulk action handlers
  const handleSelectAll = () => {
    if (selectedIds.size === sortedProperties.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedProperties.map(p => p.id)));
    }
  };

  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkAction = (action: string, newStatus: "pending" | "approved" | "flagged") => {
    if (selectedIds.size === 0) {
      toast.error("Please select at least one property");
      return;
    }

    bulkUpdate.mutate({
      propertyIds: Array.from(selectedIds).map(id => parseInt(id)),
      newStatus,
      action,
      notes: `Bulk ${action} action`,
    });
  };

  const handleAnalyze = (property: HighVarianceProperty) => {
    setLocation(`/value-drivers?parcelId=${property.parcelId}&sqft=2000&yearBuilt=2005&assessedValue=${property.assessedValue}&salePrice=${property.salePrice}`);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'a':
          e.preventDefault();
          handleBulkAction('approve', 'approved');
          break;
        case 'f':
          e.preventDefault();
          handleBulkAction('flag', 'flagged');
          break;
        case 'escape':
          e.preventDefault();
          setSelectedIds(new Set());
          toast.info('Selection cleared');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds]); // Re-attach listener when selectedIds changes

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assessment Review Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Identify and review properties with high assessment-to-sale ratio variance
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Flagged</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProperties}</div>
              <p className="text-xs text-muted-foreground mt-1">&gt;15% variance from cluster median</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Critical</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{criticalCount}</div>
              <p className="text-xs text-muted-foreground mt-1">&gt;20% variance</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Warning</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{warningCount}</div>
              <p className="text-xs text-muted-foreground mt-1">15-20% variance</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting action</p>
            </CardContent>
          </Card>
        </div>

        {/* Variance Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Variance Distribution</CardTitle>
            <CardDescription>Number of properties by variance range</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={varianceDistribution}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="range" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Filters and Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle>High Variance Properties</CardTitle>
                <CardDescription>Properties requiring assessment review</CardDescription>
              </div>

              <div className="flex gap-2">
                <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severity</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="flagged">Flagged</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {selectedIds.size > 0 && (
              <div className="mb-4 flex items-center gap-2 p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">
                  {selectedIds.size} {selectedIds.size === 1 ? "property" : "properties"} selected
                </span>
                <div className="flex gap-2 ml-auto">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleBulkAction("approve", "approved")}
                    disabled={bulkUpdate.isPending}
                    className="flex items-center gap-2"
                  >
                    Approve Selected
                    <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-xs rounded bg-background/50 border">A</kbd>
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleBulkAction("flag", "flagged")}
                    disabled={bulkUpdate.isPending}
                    className="flex items-center gap-2"
                  >
                    Flag Selected
                    <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-xs rounded bg-background/50 border">F</kbd>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkAction("reset", "pending")}
                    disabled={bulkUpdate.isPending}
                  >
                    Reset to Pending
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => { setSelectedIds(new Set()); toast.info('Selection cleared'); }}
                    className="flex items-center gap-2"
                  >
                    Clear
                    <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-xs rounded bg-background/50 border">Esc</kbd>
                  </Button>
                </div>
              </div>
            )}
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading properties...</span>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={selectedIds.size === sortedProperties.length && sortedProperties.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Parcel ID</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead className="text-right">Assessed</TableHead>
                    <TableHead className="text-right">Sale Price</TableHead>
                    <TableHead className="text-right">Ratio</TableHead>
                    <TableHead className="text-right">Variance</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedProperties.map((property) => (
                    <TableRow 
                      key={property.id}
                      onMouseEnter={(e) => {
                        setHoveredProperty(property);
                        setMousePosition({ x: e.clientX, y: e.clientY });
                      }}
                      onMouseLeave={() => setHoveredProperty(null)}
                      onMouseMove={(e) => setMousePosition({ x: e.clientX, y: e.clientY })}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(property.id)}
                          onCheckedChange={() => handleToggleSelect(property.id)}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-sm">{property.parcelId}</TableCell>
                      <TableCell>{property.address}</TableCell>
                      <TableCell className="text-right">${property.assessedValue.toLocaleString()}</TableCell>
                      <TableCell className="text-right">${property.salePrice.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-mono">{property.ratio.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <span className={property.variancePercent > 0 ? "text-red-600" : "text-green-600"}>
                          {property.variancePercent > 0 ? "+" : ""}{property.variancePercent.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={property.severity === "critical" ? "destructive" : "default"}>
                          {property.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            property.status === "approved"
                              ? "default"
                              : property.status === "flagged"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {property.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAnalyze(property)}
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          Analyze
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {!isLoading && sortedProperties.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <AlertTriangle className="w-12 h-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No High-Variance Properties Found</h3>
                <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
                  No properties match your current filter criteria. This could mean your assessments are performing well!
                </p>
                <div className="bg-muted/50 rounded-lg p-4 max-w-md">
                  <p className="text-sm font-medium mb-2">Suggestions:</p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Try adjusting the severity filter to include both Warning and Critical</li>
                    <li>Change the status filter to view all properties</li>
                    <li>Lower the variance threshold (currently set to 15%)</li>
                    <li>Check if properties need to be imported or updated</li>
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Property Preview Card on Hover */}
      {hoveredProperty && (
        <PropertyPreviewCard
          property={{
            parcelId: hoveredProperty.parcelId,
            address: hoveredProperty.address,
            sqft: 2000, // Default value - would be fetched from property details
            yearBuilt: 2005,
            bedrooms: 3,
            bathrooms: 2,
            assessedValue: hoveredProperty.assessedValue,
            salePrice: hoveredProperty.salePrice,
          }}
          position={mousePosition}
        />
      )}
    </DashboardLayout>
  );
}
