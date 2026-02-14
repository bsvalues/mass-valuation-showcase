import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { AlertTriangle, ArrowUpDown, ExternalLink, Filter, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

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

  const handleAnalyze = (property: HighVarianceProperty) => {
    setLocation(`/value-drivers?parcelId=${property.parcelId}&sqft=2000&yearBuilt=2005&assessedValue=${property.assessedValue}&salePrice=${property.salePrice}`);
  };

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
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading properties...</span>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
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
                    <TableRow key={property.id}>
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
              <div className="text-center py-8 text-muted-foreground">
                No high-variance properties found matching the selected filters.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
