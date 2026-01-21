import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Home, TrendingUp, Activity, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function DashboardAnalytics() {
  const { data: kpis, isLoading: kpisLoading } = trpc.analytics.getAssessmentKPIs.useQuery();
  const { data: trends, isLoading: trendsLoading } = trpc.analytics.getValueTrends.useQuery();
  const { data: activities, isLoading: activitiesLoading } = trpc.analytics.getRecentActivity.useQuery();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-500';
      case 'processing':
        return 'text-yellow-500';
      case 'failed':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'import':
        return '📥';
      case 'model':
        return '🤖';
      case 'batch':
        return '⚡';
      default:
        return '📊';
    }
  };

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-thin tracking-tight text-foreground">
          Dashboard <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#00FFEE] to-[#00D9D9]">Analytics</span>
        </h1>
        <p className="text-muted-foreground mt-2">
          Real-time insights and performance metrics for your valuation system
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-t-4 border-t-[#00FFEE]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assessed Value</CardTitle>
            <DollarSign className="h-4 w-4 text-[#00FFEE]" />
          </CardHeader>
          <CardContent>
            {kpisLoading ? (
              <div className="text-2xl font-bold text-muted-foreground">Loading...</div>
            ) : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(kpis?.totalValue || 0)}</div>
                <p className="text-xs text-muted-foreground flex items-center mt-1">
                  <ArrowUpRight className="w-3 h-3 text-green-500 mr-1" />
                  <span className="text-green-500 font-medium">+4.2%</span> from last year
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-[#00D9D9]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Parcels</CardTitle>
            <Home className="h-4 w-4 text-[#00D9D9]" />
          </CardHeader>
          <CardContent>
            {kpisLoading ? (
              <div className="text-2xl font-bold text-muted-foreground">Loading...</div>
            ) : (
              <>
                <div className="text-2xl font-bold">{formatNumber(kpis?.parcelCount || 0)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Properties in system
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Median Ratio (A/S)</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            {kpisLoading ? (
              <div className="text-2xl font-bold text-muted-foreground">Loading...</div>
            ) : (
              <>
                <div className="text-2xl font-bold">{(kpis?.medianRatio || 0).toFixed(2)}</div>
                <p className="text-xs text-emerald-500 mt-1">
                  Within target range (0.90 - 1.10)
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-cyan-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">COD (Uniformity)</CardTitle>
            <Activity className="h-4 w-4 text-cyan-500" />
          </CardHeader>
          <CardContent>
            {kpisLoading ? (
              <div className="text-2xl font-bold text-muted-foreground">Loading...</div>
            ) : (
              <>
                <div className="text-2xl font-bold">{(kpis?.cod || 0).toFixed(1)}%</div>
                <p className="text-xs text-cyan-500 mt-1">
                  Excellent uniformity (&lt;10%)
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Value Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-[#00FFEE]">Assessment Value Trends</CardTitle>
          <CardDescription>Total assessed value over the last 12 months</CardDescription>
        </CardHeader>
        <CardContent>
          {trendsLoading ? (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              Loading chart data...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trends || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis 
                  dataKey="month" 
                  stroke="#888"
                  tick={{ fill: '#888' }}
                />
                <YAxis 
                  stroke="#888"
                  tick={{ fill: '#888' }}
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1a1a1a', 
                    border: '1px solid #00FFEE',
                    borderRadius: '8px'
                  }}
                  labelStyle={{ color: '#00FFEE' }}
                  formatter={(value: number) => [formatCurrency(value), 'Total Value']}
                />
                <Line 
                  type="monotone" 
                  dataKey="totalValue" 
                  stroke="#00FFEE" 
                  strokeWidth={2}
                  dot={{ fill: '#00FFEE', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-[#00D9D9]">Recent Activity</CardTitle>
          <CardDescription>Latest system actions and events</CardDescription>
        </CardHeader>
        <CardContent>
          {activitiesLoading ? (
            <div className="text-muted-foreground">Loading activities...</div>
          ) : activities && activities.length > 0 ? (
            <div className="space-y-4">
              {activities.map((activity, index) => (
                <div key={index} className="flex items-start gap-4 pb-4 border-b border-border last:border-0 last:pb-0">
                  <div className="text-2xl">{getActivityIcon(activity.type)}</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className={`text-xs font-medium ${getStatusColor(activity.status)}`}>
                    {activity.status}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No recent activity to display
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
