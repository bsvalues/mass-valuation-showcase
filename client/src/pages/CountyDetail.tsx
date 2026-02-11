/**
 * County Detail Page - Drill-down view for individual county parcel data
 */

import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, MapPin, DollarSign, Home, TrendingUp, Loader2, BarChart3, Search, X } from "lucide-react";
import { motion } from "framer-motion";
import { useRoute, useLocation } from "wouter";
import { useState, useEffect, useCallback } from "react";
import { Bar } from "react-chartjs-2";
import { Input } from "@/components/ui/input";
import { ParcelMap } from "@/components/ParcelMap";

export default function CountyDetail() {
  const [, params] = useRoute("/county-detail/:countyName");
  const [, setLocation] = useLocation();
  const countyName = params?.countyName || "";

  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedParcelId, setSelectedParcelId] = useState<string | undefined>();
  const limit = 50;

  // Debounce search input (300ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPage(0); // Reset to first page on new search
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Use search query if search term exists, otherwise use regular query
  const { data: searchResults, isLoading: searchLoading } = trpc.countyParcels.searchParcels.useQuery(
    {
      countyName,
      searchTerm: debouncedSearchTerm,
      limit,
      offset: page * limit,
    },
    {
      enabled: debouncedSearchTerm.length > 0,
    }
  );

  const { data: allParcels, isLoading: allParcelsLoading } = trpc.countyParcels.getParcelsByCounty.useQuery(
    {
      countyName,
      limit,
      offset: page * limit,
    },
    {
      enabled: debouncedSearchTerm.length === 0,
    }
  );

  // Use search results if searching, otherwise use all parcels
  const parcelData = debouncedSearchTerm.length > 0 ? searchResults : allParcels;
  const parcelsLoading = debouncedSearchTerm.length > 0 ? searchLoading : allParcelsLoading;

  const { data: stats, isLoading: statsLoading } = trpc.countyParcels.getCountyValueDistribution.useQuery({
    countyName,
  });

  const { data: landHistogram } = trpc.countyParcels.getValueHistogram.useQuery({
    countyName,
    valueType: "land",
    bucketCount: 10,
  });

  const { data: buildingHistogram } = trpc.countyParcels.getValueHistogram.useQuery({
    countyName,
    valueType: "building",
    bucketCount: 10,
  });

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(10, 14, 26, 0.9)",
        titleColor: "#00FFEE",
        bodyColor: "#fff",
        borderColor: "rgba(0, 255, 238, 0.3)",
        borderWidth: 1,
        padding: 12,
        displayColors: false,
      },
    },
    scales: {
      x: {
        ticks: {
          color: "rgba(255, 255, 255, 0.7)",
          font: {
            size: 10,
          },
          maxRotation: 45,
          minRotation: 45,
        },
        grid: {
          color: "rgba(0, 255, 238, 0.1)",
        },
      },
      y: {
        ticks: {
          color: "rgba(255, 255, 255, 0.7)",
          font: {
            size: 11,
          },
        },
        grid: {
          color: "rgba(0, 255, 238, 0.1)",
        },
      },
    },
  };

  if (parcelsLoading || statsLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const totalPages = parcelData ? Math.ceil(parcelData.total / limit) : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/county-data-dashboard")}
              className="bg-transparent border-primary/30 text-primary hover:bg-primary/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-[#00FFFF] flex items-center gap-2">
                <MapPin className="w-8 h-8" />
                {countyName} County
              </h1>
              <p className="text-slate-400 mt-1">Detailed parcel data and statistics</p>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="terra-card bg-[rgba(10,14,26,0.6)] border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Parcels</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {stats?.parcelCount?.toLocaleString() || "0"}
              </div>
            </CardContent>
          </Card>

          <Card className="terra-card bg-[rgba(10,14,26,0.6)] border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Land Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(stats?.avgLandValue || 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Range: {formatCurrency(stats?.minLandValue || 0)} - {formatCurrency(stats?.maxLandValue || 0)}
              </p>
            </CardContent>
          </Card>

          <Card className="terra-card bg-[rgba(10,14,26,0.6)] border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Building Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(stats?.avgBuildingValue || 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Range: {formatCurrency(stats?.minBuildingValue || 0)} - {formatCurrency(stats?.maxBuildingValue || 0)}
              </p>
            </CardContent>
          </Card>

          <Card className="terra-card bg-[rgba(10,14,26,0.6)] border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Avg Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {formatCurrency((stats?.avgLandValue || 0) + (stats?.avgBuildingValue || 0))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Combined assessment</p>
            </CardContent>
          </Card>
        </div>

        {/* Parcel Map Visualization */}
        {parcelData && parcelData.parcels.length > 0 && (
          <Card className="terra-card bg-[rgba(10,14,26,0.6)] border-primary/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                <CardTitle className="text-[#00FFFF]">Parcel Boundaries Map</CardTitle>
              </div>
              <CardDescription className="text-slate-400">
                Click parcels to highlight and view details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ParcelMap
                parcels={parcelData.parcels}
                selectedParcelId={selectedParcelId}
                onParcelClick={(id) => setSelectedParcelId(id)}
                className="h-[500px]"
              />
            </CardContent>
          </Card>
        )}

        {/* Value Distribution Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Land Value Distribution */}
          {landHistogram && landHistogram.buckets.length > 0 && (
            <Card className="terra-card bg-[rgba(10,14,26,0.6)] border-primary/20">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  <CardTitle className="text-[#00FFFF]">Land Value Distribution</CardTitle>
                </div>
                <CardDescription className="text-slate-400">
                  Distribution of land values across parcels
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <Bar
                    data={{
                      labels: landHistogram.buckets.map((b) => b.range),
                      datasets: [
                        {
                          label: "Parcel Count",
                          data: landHistogram.buckets.map((b) => b.count),
                          backgroundColor: "rgba(0, 255, 238, 0.2)",
                          borderColor: "rgba(0, 255, 238, 0.8)",
                          borderWidth: 2,
                        },
                      ],
                    }}
                    options={chartOptions}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Building Value Distribution */}
          {buildingHistogram && buildingHistogram.buckets.length > 0 && (
            <Card className="terra-card bg-[rgba(10,14,26,0.6)] border-primary/20">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Home className="w-5 h-5 text-primary" />
                  <CardTitle className="text-[#00FFFF]">Building Value Distribution</CardTitle>
                </div>
                <CardDescription className="text-slate-400">
                  Distribution of building values across parcels
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <Bar
                    data={{
                      labels: buildingHistogram.buckets.map((b) => b.range),
                      datasets: [
                        {
                          label: "Parcel Count",
                          data: buildingHistogram.buckets.map((b) => b.count),
                          backgroundColor: "rgba(0, 255, 238, 0.2)",
                          borderColor: "rgba(0, 255, 238, 0.8)",
                          borderWidth: 2,
                        },
                      ],
                    }}
                    options={chartOptions}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Parcel Data Table */}
        <Card className="terra-card bg-[rgba(10,14,26,0.6)] border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-[#00FFFF]">Parcel Data</CardTitle>
                <CardDescription className="text-slate-400">
                  {debouncedSearchTerm ? (
                    <>
                      Found {parcelData?.total || 0} results for "{debouncedSearchTerm}"
                    </>
                  ) : (
                    <>
                      Showing {page * limit + 1} - {Math.min((page + 1) * limit, parcelData?.total || 0)} of{" "}
                      {parcelData?.total || 0} parcels
                    </>
                  )}
                </CardDescription>
              </div>
              <div className="relative w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by Parcel ID or Address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-10 bg-background/50 border-primary/30 text-foreground placeholder:text-muted-foreground focus:border-primary"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-primary/20 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-primary/20 hover:bg-primary/5">
                    <TableHead className="text-primary">Parcel ID</TableHead>
                    <TableHead className="text-primary">Address</TableHead>
                    <TableHead className="text-primary text-right">Land Value</TableHead>
                    <TableHead className="text-primary text-right">Building Value</TableHead>
                    <TableHead className="text-primary text-right">Total Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parcelData?.parcels.map((parcel, idx) => (
                    <TableRow
                      key={idx}
                      onClick={() => setSelectedParcelId(parcel.id.toString())}
                      className={`border-primary/10 hover:bg-primary/5 transition-colors cursor-pointer ${
                        selectedParcelId === parcel.id.toString() ? 'bg-primary/10' : ''
                      }`}
                    >
                      <TableCell className="font-mono text-sm">{parcel.parcelId}</TableCell>
                      <TableCell className="max-w-xs truncate">{parcel.situsAddress || "N/A"}</TableCell>
                      <TableCell className="text-right">{formatCurrency(parcel.valueLand)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(parcel.valueBuilding)}</TableCell>
                      <TableCell className="text-right font-semibold text-primary">
                        {formatCurrency((parcel.valueLand || 0) + (parcel.valueBuilding || 0))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="bg-transparent border-primary/30 text-primary hover:bg-primary/10 disabled:opacity-30"
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page + 1} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="bg-transparent border-primary/30 text-primary hover:bg-primary/10 disabled:opacity-30"
              >
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
