/**
 * Appeals Analytics Dashboard
 * Visualizes appeal trends, processing times, success rates, and value adjustments
 */

import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { BarChart3, TrendingUp, Clock, DollarSign, Filter } from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Line, Pie } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function AppealsAnalytics() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedCounty, setSelectedCounty] = useState<string>("");

  // Fetch analytics data
  const { data: summaryStats } = trpc.analytics.getSummaryStats.useQuery({
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    countyName: selectedCounty || undefined,
  });

  const { data: resolutionTrends = [] } = trpc.analytics.getResolutionTrends.useQuery({
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    countyName: selectedCounty || undefined,
  });

  const { data: processingTimes = [] } = trpc.analytics.getProcessingTimeByCounty.useQuery({
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const { data: successRates = [] } = trpc.analytics.getSuccessRates.useQuery({
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    countyName: selectedCounty || undefined,
  });

  const { data: valueAdjustments = [] } = trpc.analytics.getValueAdjustments.useQuery({
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    countyName: selectedCounty || undefined,
  });

  // Chart data configurations
  const resolutionTrendsData = {
    labels: resolutionTrends.map((item: any) => item.month),
    datasets: [
      {
        label: "Resolved Appeals",
        data: resolutionTrends.map((item: any) => item.count),
        backgroundColor: "rgba(0, 255, 238, 0.6)",
        borderColor: "rgba(0, 255, 238, 1)",
        borderWidth: 2,
      },
    ],
  };

  const processingTimesData = {
    labels: processingTimes.map((item: any) => item.countyName),
    datasets: [
      {
        label: "Average Processing Days",
        data: processingTimes.map((item: any) => Math.round(item.avgDays)),
        backgroundColor: "rgba(147, 51, 234, 0.6)",
        borderColor: "rgba(147, 51, 234, 1)",
        borderWidth: 2,
      },
    ],
  };

  const successRatesData = {
    labels: successRates.map((item: any) => item.outcome),
    datasets: [
      {
        label: "Appeals",
        data: successRates.map((item: any) => item.count),
        backgroundColor: [
          "rgba(34, 197, 94, 0.6)",  // Green for Approved
          "rgba(239, 68, 68, 0.6)",  // Red for Denied
          "rgba(156, 163, 175, 0.6)", // Gray for Withdrawn
        ],
        borderColor: [
          "rgba(34, 197, 94, 1)",
          "rgba(239, 68, 68, 1)",
          "rgba(156, 163, 175, 1)",
        ],
        borderWidth: 2,
      },
    ],
  };

  // Group value adjustments into histogram bins
  const adjustmentBins = [
    { label: "$0-$10k", min: 0, max: 10000 },
    { label: "$10k-$25k", min: 10000, max: 25000 },
    { label: "$25k-$50k", min: 25000, max: 50000 },
    { label: "$50k-$100k", min: 50000, max: 100000 },
    { label: "$100k+", min: 100000, max: Infinity },
  ];

  const adjustmentHistogram = adjustmentBins.map((bin) => ({
    label: bin.label,
    count: valueAdjustments.filter(
      (adj: any) => adj.adjustment >= bin.min && adj.adjustment < bin.max
    ).length,
  }));

  const valueAdjustmentsData = {
    labels: adjustmentHistogram.map((bin) => bin.label),
    datasets: [
      {
        label: "Number of Appeals",
        data: adjustmentHistogram.map((bin) => bin.count),
        backgroundColor: "rgba(59, 130, 246, 0.6)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top" as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "right" as const,
      },
    },
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Appeals Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive insights into appeal trends, processing efficiency, and outcomes
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </CardTitle>
            <CardDescription>Filter analytics by date range and county</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="county">County</Label>
                <Select value={selectedCounty} onValueChange={setSelectedCounty}>
                  <SelectTrigger id="county">
                    <SelectValue placeholder="All Counties" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Counties</SelectItem>
                    <SelectItem value="Benton County">Benton County</SelectItem>
                    <SelectItem value="Franklin County">Franklin County</SelectItem>
                    <SelectItem value="Walla Walla County">Walla Walla County</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                  setSelectedCounty("");
                }}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Summary Statistics */}
        {summaryStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Appeals</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summaryStats.totalAppeals}</div>
                <p className="text-xs text-muted-foreground">
                  {summaryStats.resolvedAppeals} resolved
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Processing Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(summaryStats.avgProcessingDays || 0)} days
                </div>
                <p className="text-xs text-muted-foreground">
                  From filing to resolution
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Value Adjusted</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${(summaryStats.totalValueAdjusted / 1000000).toFixed(2)}M
                </div>
                <p className="text-xs text-muted-foreground">
                  Cumulative assessment reductions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Appeals</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summaryStats.pendingAppeals}</div>
                <p className="text-xs text-muted-foreground">
                  {summaryStats.inReviewAppeals} in review
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Resolution Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Resolution Trends</CardTitle>
              <CardDescription>Monthly resolved appeals over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <Line data={resolutionTrendsData} options={chartOptions} />
              </div>
            </CardContent>
          </Card>

          {/* Processing Times by County */}
          <Card>
            <CardHeader>
              <CardTitle>Processing Time by County</CardTitle>
              <CardDescription>Average days from filing to resolution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <Bar data={processingTimesData} options={chartOptions} />
              </div>
            </CardContent>
          </Card>

          {/* Success Rates */}
          <Card>
            <CardHeader>
              <CardTitle>Appeal Outcomes</CardTitle>
              <CardDescription>Distribution of appeal resolutions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <Pie data={successRatesData} options={pieChartOptions} />
              </div>
            </CardContent>
          </Card>

          {/* Value Adjustments Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Value Adjustment Distribution</CardTitle>
              <CardDescription>Histogram of assessment reductions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <Bar data={valueAdjustmentsData} options={chartOptions} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
