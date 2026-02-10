/**
 * County Data Dashboard - Comprehensive view of WA county parcel data
 */

import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { MapPin, TrendingUp, DollarSign, Home, Calendar, Loader2, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function CountyDataDashboard() {
  const { data: countyStats, isLoading } = trpc.countyStats.getAllCountyStats.useQuery();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDataFreshness = (lastUpdated: Date | string) => {
    const now = new Date();
    const updated = new Date(lastUpdated);
    const diffDays = Math.floor((now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return { label: "Today", color: "text-green-500" };
    if (diffDays === 1) return { label: "Yesterday", color: "text-green-400" };
    if (diffDays < 7) return { label: `${diffDays} days ago`, color: "text-yellow-500" };
    if (diffDays < 30) return { label: `${Math.floor(diffDays / 7)} weeks ago`, color: "text-orange-500" };
    return { label: `${Math.floor(diffDays / 30)} months ago`, color: "text-red-500" };
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const totalParcels = countyStats?.reduce((sum, county) => sum + (county.parcelCount ?? 0), 0) || 0;
  const countiesWithData = countyStats?.filter(c => (c.parcelCount ?? 0) > 0).length || 0;
  const totalCounties = 39; // WA State has 39 counties

  // Prepare chart data - Top 10 counties by parcel count
  const top10Counties = countyStats
    ?.filter(c => (c.parcelCount ?? 0) > 0)
    .sort((a, b) => (b.parcelCount ?? 0) - (a.parcelCount ?? 0))
    .slice(0, 10) || [];

  const parcelCountChartData = {
    labels: top10Counties.map(c => c.countyName),
    datasets: [
      {
        label: 'Parcel Count',
        data: top10Counties.map(c => c.parcelCount ?? 0),
        backgroundColor: 'rgba(0, 255, 238, 0.2)',
        borderColor: 'rgba(0, 255, 238, 0.8)',
        borderWidth: 2,
      },
    ],
  };

  const landValueChartData = {
    labels: top10Counties.map(c => c.countyName),
    datasets: [
      {
        label: 'Average Land Value',
        data: top10Counties.map(c => c.avgLandValue ?? 0),
        backgroundColor: 'rgba(0, 255, 238, 0.2)',
        borderColor: 'rgba(0, 255, 238, 0.8)',
        borderWidth: 2,
      },
    ],
  };

  const buildingValueChartData = {
    labels: top10Counties.map(c => c.countyName),
    datasets: [
      {
        label: 'Average Building Value',
        data: top10Counties.map(c => c.avgBuildingValue ?? 0),
        backgroundColor: 'rgba(0, 255, 238, 0.2)',
        borderColor: 'rgba(0, 255, 238, 0.8)',
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(10, 14, 26, 0.9)',
        titleColor: '#00FFEE',
        bodyColor: '#fff',
        borderColor: 'rgba(0, 255, 238, 0.3)',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
      },
    },
    scales: {
      x: {
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          font: {
            size: 11,
          },
        },
        grid: {
          color: 'rgba(0, 255, 238, 0.1)',
        },
      },
      y: {
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          font: {
            size: 11,
          },
        },
        grid: {
          color: 'rgba(0, 255, 238, 0.1)',
        },
      },
    },
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">County Data Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive view of Washington State county parcel data
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="terra-card bg-[rgba(10,14,26,0.6)] border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Parcels</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{totalParcels.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Across all counties</p>
            </CardContent>
          </Card>

          <Card className="terra-card bg-[rgba(10,14,26,0.6)] border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Counties Loaded</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {countiesWithData} / {totalCounties}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round((countiesWithData / totalCounties) * 100)}% coverage
              </p>
            </CardContent>
          </Card>

          <Card className="terra-card bg-[rgba(10,14,26,0.6)] border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Latest Update</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {countyStats && countyStats.length > 0
                  ? formatDate(countyStats[0].lastUpdated)
                  : "N/A"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Most recent data load</p>
            </CardContent>
          </Card>
        </div>

        {/* Comparison Charts */}
        {top10Counties.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Parcel Count Chart */}
            <Card className="terra-card bg-[rgba(10,14,26,0.6)] border-primary/20">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  <CardTitle className="text-[#00FFFF]">Top 10 Counties by Parcel Count</CardTitle>
                </div>
                <CardDescription className="text-slate-400">
                  Counties with the most parcels loaded
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <Bar data={parcelCountChartData} options={chartOptions} />
                </div>
              </CardContent>
            </Card>

            {/* Land Value Chart */}
            <Card className="terra-card bg-[rgba(10,14,26,0.6)] border-primary/20">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Home className="w-5 h-5 text-primary" />
                  <CardTitle className="text-[#00FFFF]">Average Land Value Comparison</CardTitle>
                </div>
                <CardDescription className="text-slate-400">
                  Average land value across top 10 counties
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <Bar data={landValueChartData} options={{
                    ...chartOptions,
                    plugins: {
                      ...chartOptions.plugins,
                      tooltip: {
                        ...chartOptions.plugins.tooltip,
                        callbacks: {
                          label: (context: any) => {
                            return `$${context.parsed.y.toLocaleString()}`;
                          },
                        },
                      },
                    },
                  }} />
                </div>
              </CardContent>
            </Card>

            {/* Building Value Chart */}
            <Card className="terra-card bg-[rgba(10,14,26,0.6)] border-primary/20">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-primary" />
                  <CardTitle className="text-[#00FFFF]">Average Building Value Comparison</CardTitle>
                </div>
                <CardDescription className="text-slate-400">
                  Average building value across top 10 counties
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <Bar data={buildingValueChartData} options={{
                    ...chartOptions,
                    plugins: {
                      ...chartOptions.plugins,
                      tooltip: {
                        ...chartOptions.plugins.tooltip,
                        callbacks: {
                          label: (context: any) => {
                            return `$${context.parsed.y.toLocaleString()}`;
                          },
                        },
                      },
                    },
                  }} />
                </div>
              </CardContent>
            </Card>

            {/* Combined Assessment Value Chart */}
            <Card className="terra-card bg-[rgba(10,14,26,0.6)] border-primary/20">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <CardTitle className="text-[#00FFFF]">Total Average Assessment Value</CardTitle>
                </div>
                <CardDescription className="text-slate-400">
                  Combined land + building average values
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <Bar data={{
                    labels: top10Counties.map(c => c.countyName),
                    datasets: [
                      {
                        label: 'Total Avg Value',
                        data: top10Counties.map(c => (c.avgLandValue ?? 0) + (c.avgBuildingValue ?? 0)),
                        backgroundColor: 'rgba(0, 255, 238, 0.2)',
                        borderColor: 'rgba(0, 255, 238, 0.8)',
                        borderWidth: 2,
                      },
                    ],
                  }} options={{
                    ...chartOptions,
                    plugins: {
                      ...chartOptions.plugins,
                      tooltip: {
                        ...chartOptions.plugins.tooltip,
                        callbacks: {
                          label: (context: any) => {
                            return `$${context.parsed.y.toLocaleString()}`;
                          },
                        },
                      },
                    },
                  }} />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* County List */}
        <Card className="terra-card bg-[rgba(10,14,26,0.6)] border-primary/20">
          <CardHeader>
            <CardTitle className="text-[#00FFFF]">County Coverage</CardTitle>
            <CardDescription className="text-slate-400">
              Detailed statistics for each Washington State county
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!countyStats || countyStats.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No county data loaded yet</p>
                <p className="text-sm mt-2">Load parcel data from WA Data Ingestion</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {countyStats.map((county, index) => {
                  const freshness = getDataFreshness(county.lastUpdated);
                  
                  return (
                    <motion.div
                      key={county.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <Card className="bg-background/20 border-primary/10 hover:border-primary/30 transition-colors">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-primary" />
                              <CardTitle className="text-base">{county.countyName}</CardTitle>
                            </div>
                            <Badge variant="outline" className="text-xs bg-primary/10 border-primary/30">
                              {(county.parcelCount ?? 0).toLocaleString()}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Home className="w-3 h-3" />
                              Avg Land
                            </span>
                            <span className="font-mono text-foreground">
                              {formatCurrency(county.avgLandValue || 0)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              Avg Building
                            </span>
                            <span className="font-mono text-foreground">
                              {formatCurrency(county.avgBuildingValue || 0)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm pt-2 border-t border-border/50">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Updated
                            </span>
                            <span className={`text-xs ${freshness.color}`}>
                              {freshness.label}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
