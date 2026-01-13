import { DashboardLayout } from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Zap, PieChart as PieChartIcon, Activity } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';

const salesRatioData = [
  { month: 'Jan', ratio: 0.92 },
  { month: 'Feb', ratio: 0.94 },
  { month: 'Mar', ratio: 0.95 },
  { month: 'Apr', ratio: 0.98 },
  { month: 'May', ratio: 1.02 },
  { month: 'Jun', ratio: 1.05 },
  { month: 'Jul', ratio: 1.04 },
  { month: 'Aug', ratio: 1.01 },
  { month: 'Sep', ratio: 0.99 },
  { month: 'Oct', ratio: 0.97 },
  { month: 'Nov', ratio: 0.96 },
  { month: 'Dec', ratio: 0.95 },
];

const propertyTypeData = [
  { name: 'Residential', value: 4500, color: '#00ffee' },
  { name: 'Commercial', value: 1200, color: '#a855f7' },
  { name: 'Industrial', value: 800, color: '#22c55e' },
  { name: 'Agricultural', value: 500, color: '#eab308' },
];

const valuationChangeData = [
  { range: '< -10%', count: 150 },
  { range: '-10% to -5%', count: 300 },
  { range: '-5% to 0%', count: 800 },
  { range: '0% to 5%', count: 2500 },
  { range: '5% to 10%', count: 1200 },
  { range: '> 10%', count: 400 },
];

export default function MarketAnalysis() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-[#00ffee]" />
              Market Analysis
            </h1>
            <p className="text-slate-400 mt-1">
              Real-time market trends and sales ratio studies.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-[#00ffee]/10 text-[#00ffee] border-[#00ffee]/20 px-3 py-1">
              <Zap className="w-3 h-3 mr-1 animate-pulse" />
              Live Feed Active
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Sales Ratio Trend Chart */}
          <Card className="terra-card lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <TrendingUp className="w-5 h-5 text-green-400" />
                Sales Ratio Trend (12 Months)
              </CardTitle>
              <CardDescription>Median sales ratio. Target range: 0.90 - 1.10.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesRatioData}>
                    <defs>
                      <linearGradient id="colorRatio" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00ffee" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#00ffee" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} domain={[0.8, 1.2]} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0b1020', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
                      itemStyle={{ color: '#00ffee' }}
                    />
                    <Area type="monotone" dataKey="ratio" stroke="#00ffee" strokeWidth={2} fillOpacity={1} fill="url(#colorRatio)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Property Type Distribution */}
          <Card className="terra-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <PieChartIcon className="w-5 h-5 text-purple-400" />
                Parcel Distribution
              </CardTitle>
              <CardDescription>Breakdown by property class.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={propertyTypeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {propertyTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(0,0,0,0.5)" />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0b1020', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Valuation Change Histogram */}
          <Card className="terra-card lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Activity className="w-5 h-5 text-blue-400" />
                Valuation Change Distribution
              </CardTitle>
              <CardDescription>Count of parcels by percentage change in value vs. previous year.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={valuationChangeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                    <XAxis dataKey="range" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      contentStyle={{ backgroundColor: '#0b1020', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
                    />
                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={60} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
