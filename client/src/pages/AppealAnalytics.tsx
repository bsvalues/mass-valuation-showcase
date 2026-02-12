import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, Clock, CheckCircle2, DollarSign, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function AppealAnalytics() {
  // Fetch real data from tRPC
  const { data: resolutionTimeData, isLoading: loadingResolution } = trpc.appeals.getResolutionTimeTrend.useQuery();
  const { data: successRateData, isLoading: loadingSuccess } = trpc.appeals.getSuccessRateByType.useQuery();
  const { data: valueAdjustmentData, isLoading: loadingValue } = trpc.appeals.getValueAdjustmentDistribution.useQuery();
  const { data: kpiData, isLoading: loadingKPIs } = trpc.appeals.getAnalyticsKPIs.useQuery();
  const { data: statusCounts } = trpc.appeals.getStatusCounts.useQuery();

  // Status distribution with colors
  const statusDistribution = statusCounts ? [
    { status: "Pending", count: statusCounts.pending, color: "#f59e0b" },
    { status: "In Review", count: statusCounts.in_review, color: "#3b82f6" },
    { status: "Hearing", count: statusCounts.hearing_scheduled, color: "#8b5cf6" },
    { status: "Resolved", count: statusCounts.resolved, color: "#10b981" },
    { status: "Withdrawn", count: statusCounts.withdrawn, color: "#6b7280" },
  ] : [];

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    return `$${(value / 1000).toFixed(0)}K`;
  };

  const kpiCards = kpiData ? [
    {
      title: "Average Resolution Time",
      value: `${kpiData.avgResolutionDays} days`,
      change: "-12%", // TODO: Calculate actual change from previous period
      icon: Clock,
      trend: "down" as const,
    },
    {
      title: "Overall Success Rate",
      value: `${kpiData.successRate}%`,
      change: "+5%", // TODO: Calculate actual change
      icon: CheckCircle2,
      trend: "up" as const,
    },
    {
      title: "Total Value Adjusted",
      value: formatCurrency(kpiData.totalValueAdjusted),
      change: "+18%", // TODO: Calculate actual change
      icon: DollarSign,
      trend: "up" as const,
    },
    {
      title: "Appeals This Month",
      value: kpiData.appealsThisMonth.toString(),
      change: "+8%", // TODO: Calculate actual change
      icon: TrendingUp,
      trend: "up" as const,
    },
  ] : [];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Appeal Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Performance metrics and trend analysis for property tax appeals
          </p>
        </div>

        {/* KPI Cards */}
        {loadingKPIs ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpiCards.map((kpi) => {
              const Icon = kpi.icon;
              return (
                <Card key={kpi.title}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{kpi.value}</div>
                    <p className={`text-xs ${kpi.trend === "up" ? "text-green-500" : "text-red-500"} flex items-center mt-1`}>
                      {kpi.change} from last month
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Resolution Time Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Average Resolution Time Trend</CardTitle>
              <CardDescription>Days to resolve appeals over time</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingResolution ? (
                <div className="flex items-center justify-center h-[300px]">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : resolutionTimeData && resolutionTimeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={resolutionTimeData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                      labelStyle={{ color: "hsl(var(--foreground))" }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="avgDays" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      name="Avg Days"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  No resolution data available yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Status Distribution</CardTitle>
              <CardDescription>Current appeal status breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              {statusDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ status, count }) => `${status}: ${count}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  No appeals data available yet
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Success Rate by Property Type */}
          <Card>
            <CardHeader>
              <CardTitle>Success Rate by Property Type</CardTitle>
              <CardDescription>Percentage of successful appeals by property classification</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSuccess ? (
                <div className="flex items-center justify-center h-[300px]">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : successRateData && successRateData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={successRateData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="propertyType" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                      labelStyle={{ color: "hsl(var(--foreground))" }}
                    />
                    <Legend />
                    <Bar dataKey="successRate" fill="hsl(var(--primary))" name="Success Rate %" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  No property type data available yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Value Adjustment Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Value Adjustment Distribution</CardTitle>
              <CardDescription>Number of appeals by value reduction amount</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingValue ? (
                <div className="flex items-center justify-center h-[300px]">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : valueAdjustmentData && valueAdjustmentData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={valueAdjustmentData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="range" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                      labelStyle={{ color: "hsl(var(--foreground))" }}
                    />
                    <Legend />
                    <Bar dataKey="count" fill="#10b981" name="Number of Appeals" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  No value adjustment data available yet
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
