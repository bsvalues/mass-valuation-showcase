import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, Clock, CheckCircle2, DollarSign } from "lucide-react";

export default function AppealAnalytics() {
  // Mock data for analytics (replace with real tRPC queries after migration)
  const resolutionTimeData = [
    { month: "Jan", avgDays: 45 },
    { month: "Feb", avgDays: 42 },
    { month: "Mar", avgDays: 38 },
    { month: "Apr", avgDays: 41 },
    { month: "May", avgDays: 36 },
    { month: "Jun", avgDays: 34 },
  ];

  const successRateByType = [
    { propertyType: "Residential", successRate: 68, total: 145 },
    { propertyType: "Commercial", successRate: 52, total: 89 },
    { propertyType: "Industrial", successRate: 45, total: 34 },
    { propertyType: "Agricultural", successRate: 71, total: 28 },
  ];

  const valueAdjustmentData = [
    { range: "$0-$10K", count: 45 },
    { range: "$10K-$25K", count: 78 },
    { range: "$25K-$50K", count: 52 },
    { range: "$50K-$100K", count: 28 },
    { range: "$100K+", count: 12 },
  ];

  const statusDistribution = [
    { status: "Pending", count: 42, color: "#f59e0b" },
    { status: "In Review", count: 38, color: "#3b82f6" },
    { status: "Hearing", count: 15, color: "#8b5cf6" },
    { status: "Resolved", count: 89, color: "#10b981" },
    { status: "Withdrawn", count: 12, color: "#6b7280" },
  ];

  const kpiData = [
    {
      title: "Average Resolution Time",
      value: "38 days",
      change: "-12%",
      icon: Clock,
      trend: "down",
    },
    {
      title: "Overall Success Rate",
      value: "64%",
      change: "+5%",
      icon: CheckCircle2,
      trend: "up",
    },
    {
      title: "Total Value Adjusted",
      value: "$8.2M",
      change: "+18%",
      icon: DollarSign,
      trend: "up",
    },
    {
      title: "Appeals This Month",
      value: "42",
      change: "+8%",
      icon: TrendingUp,
      trend: "up",
    },
  ];

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiData.map((kpi) => {
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

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Resolution Time Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Average Resolution Time Trend</CardTitle>
              <CardDescription>Days to resolve appeals over time</CardDescription>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>

          {/* Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Status Distribution</CardTitle>
              <CardDescription>Current appeal status breakdown</CardDescription>
            </CardHeader>
            <CardContent>
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
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={successRateByType}>
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
            </CardContent>
          </Card>

          {/* Value Adjustment Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Value Adjustment Distribution</CardTitle>
              <CardDescription>Number of appeals by value reduction amount</CardDescription>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
