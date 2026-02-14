import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { AlertTriangle, ArrowUpDown, ExternalLink, Filter } from "lucide-react";
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

  // Mock data - replace with tRPC query
  const mockProperties: HighVarianceProperty[] = [
    {
      id: "1",
      parcelId: "12345",
      address: "123 Main St",
      assessedValue: 485000,
      salePrice: 395000,
      ratio: 1.23,
      clusterMedianRatio: 0.96,
      variancePercent: 28.1,
      severity: "critical",
      clusterId: 2,
      status: "pending"
    },
    {
      id: "2",
      parcelId: "67890",
      address: "456 Oak Ave",
      assessedValue: 375000,
      salePrice: 425000,
      ratio: 0.88,
      clusterMedianRatio: 0.96,
      variancePercent: -8.3,
      severity: "warning",
      clusterId: 1,
      lastReviewDate: "2026-01-15",
      status: "approved"
    },
    {
      id: "3",
      parcelId: "11111",
      address: "789 Pine Rd",
      assessedValue: 520000,
      salePrice: 445000,
      ratio: 1.17,
      clusterMedianRatio: 0.96,
      variancePercent: 21.9,
      severity: "critical",
      clusterId: 2,
      status: "flagged"
    },
    {
      id: "4",
      parcelId: "22222",
      address: "321 Elm St",
      assessedValue: 295000,
      salePrice: 315000,
      ratio: 0.94,
      clusterMedianRatio: 1.08,
      variancePercent: -13.0,
      severity: "warning",
      clusterId: 3,
      status: "pending"
    },
    {
      id: "5",
      parcelId: "33333",
      address: "555 Maple Dr",
      assessedValue: 610000,
      salePrice: 495000,
      ratio: 1.23,
      clusterMedianRatio: 0.96,
      variancePercent: 28.1,
      severity: "critical",
      clusterId: 2,
      status: "pending"
    }
  ];

  const filteredProperties = mockProperties
    .filter(p => filterSeverity === "all" || p.severity === filterSeverity)
    .filter(p => filterStatus === "all" || p.status === filterStatus)
    .sort((a, b) => {
      if (sortBy === "variancePercent") return Math.abs(b.variancePercent) - Math.abs(a.variancePercent);
      if (sortBy === "assessedValue") return b.assessedValue - a.assessedValue;
      return 0;
    });

  // Variance distribution data
  const varianceDistribution = [
    { range: "-30 to -20%", count: 2 },
    { range: "-20 to -10%", count: 5 },
    { range: "-10 to 0%", count: 12 },
    { range: "0 to 10%", count: 45 },
    { range: "10 to 20%", count: 8 },
    { range: "20 to 30%", count: 3 },
    { range: "30%+", count: 1 }
  ];

  const getSeverityBadge = (severity: string) => {
    if (severity === "critical") {
      return <Badge variant="destructive">Critical</Badge>;
    }
    return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Warning</Badge>;
  };

  const getStatusBadge = (status: string) => {
    if (status === "approved") return <Badge variant="default" className="bg-green-500/10 text-green-500 border-green-500/20">Approved</Badge>;
    if (status === "flagged") return <Badge variant="destructive">Flagged</Badge>;
    return <Badge variant="secondary">Pending</Badge>;
  };

  const analyzeProperty = (parcelId: string) => {
    setLocation(`/value-drivers?parcelId=${parcelId}`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Assessment Review Dashboard</h1>
          <p className="text-muted-foreground">Properties with high ratio variance requiring review</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Flagged</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredProperties.length}</div>
              <p className="text-xs text-muted-foreground">Properties requiring review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Critical</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {filteredProperties.filter(p => p.severity === "critical").length}
              </div>
              <p className="text-xs text-muted-foreground">&gt;20% variance</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Warning</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">
                {filteredProperties.filter(p => p.severity === "warning").length}
              </div>
              <p className="text-xs text-muted-foreground">15-20% variance</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filteredProperties.filter(p => p.status === "pending").length}
              </div>
              <p className="text-xs text-muted-foreground">Awaiting action</p>
            </CardContent>
          </Card>
        </div>

        {/* Variance Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Variance Distribution</CardTitle>
            <CardDescription>Distribution of assessment-to-sale ratio variance across all properties</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={varianceDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#00FFEE" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Filters and Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>High Variance Properties</CardTitle>
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

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="variancePercent">Variance %</SelectItem>
                    <SelectItem value="assessedValue">Assessed Value</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Severity</TableHead>
                  <TableHead>Parcel ID</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead className="text-right">Assessed Value</TableHead>
                  <TableHead className="text-right">Sale Price</TableHead>
                  <TableHead className="text-right">Ratio</TableHead>
                  <TableHead className="text-right">Cluster Median</TableHead>
                  <TableHead className="text-right">Variance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProperties.map(property => (
                  <TableRow key={property.id}>
                    <TableCell>{getSeverityBadge(property.severity)}</TableCell>
                    <TableCell className="font-mono text-sm">{property.parcelId}</TableCell>
                    <TableCell>{property.address}</TableCell>
                    <TableCell className="text-right">${property.assessedValue.toLocaleString()}</TableCell>
                    <TableCell className="text-right">${property.salePrice.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-mono">{property.ratio.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-mono">{property.clusterMedianRatio.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <span className={property.variancePercent > 0 ? "text-red-500" : "text-green-500"}>
                        {property.variancePercent > 0 ? "+" : ""}{property.variancePercent.toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(property.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => analyzeProperty(property.parcelId)}
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Analyze
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
