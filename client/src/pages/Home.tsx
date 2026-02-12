import { useAuth } from "@/_core/hooks/useAuth";
import { DashboardLayout } from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ArrowUpRight, 
  BarChart3, 
  Brain, 
  Calculator, 
  CheckCircle2, 
  Clock, 
  Database, 
  Factory, 
  Layers, 
  MapIcon, 
  Shield, 
  ShieldCheck, 
  Sliders, 
  TrendingUp, 
  Upload, 
  Users, 
  Zap 
} from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { AppealDetailModal } from "@/components/AppealDetailModal";
import { useGlobalSimulation } from "@/contexts/GlobalSimulationContext";
import { LineChart, Line, Area, ResponsiveContainer, Tooltip } from "recharts";

export default function Home() {
  const { user, loading, error, isAuthenticated } = useAuth();
  const { systemResonance, isRevalRunning } = useGlobalSimulation();
  
  // Fetch appeals status counts and trend data
  const [dateRange, setDateRange] = useState<"7" | "30" | "90">("30");
  const [appealModalOpen, setAppealModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<"pending" | "in_review" | "hearing_scheduled" | "resolved" | "withdrawn" | null>(null);
  const { data: statusCounts } = trpc.appeals.getStatusCounts.useQuery();
  const { data: trendData } = trpc.appeals.getTrendData.useQuery({ dateRange });

  const handleStatusClick = (status: "pending" | "in_review" | "hearing_scheduled" | "resolved" | "withdrawn") => {
    setSelectedStatus(status);
    setAppealModalOpen(true);
  };

  const suiteCards = [
    {
      title: "DATA SUITE",
      description: "Ingest, manage, and visualize property data from multiple sources",
      icon: Database,
      color: "from-blue-500 to-cyan-500",
      items: [
        { label: "WA Data Ingestion", href: "/wa-data-ingestion", icon: Upload },
        { label: "County Dashboard", href: "/county-data-dashboard", icon: BarChart3 },
        { label: "Map Explorer", href: "/map-explorer", icon: MapIcon },
      ]
    },
    {
      title: "VALUATION SUITE",
      description: "Core valuation engines for mass appraisal and automated valuation models",
      icon: Factory,
      color: "from-purple-500 to-pink-500",
      items: [
        { label: "Mass Valuation Studio", href: "/mass-valuation", icon: Factory },
        { label: "AVM Studio", href: "/avm-studio", icon: Brain },
        { label: "Batch Valuation", href: "/batch-valuation", icon: Zap },
        { label: "Cost Matrix", href: "/cost-matrix", icon: Calculator },
      ]
    },
    {
      title: "ANALYSIS SUITE",
      description: "Statistical analysis, calibration, and quality assurance tools",
      icon: TrendingUp,
      color: "from-green-500 to-emerald-500",
      items: [
        { label: "Market Analysis", href: "/analysis", icon: BarChart3 },
        { label: "Calibration Studio", href: "/calibration", icon: Sliders },
        { label: "Regression Studio", href: "/regression", icon: TrendingUp },
        { label: "QA / Ratio Studies", href: "/qa-ratio-studies", icon: ShieldCheck },
      ]
    },
    {
      title: "GOVERNANCE SUITE",
      description: "Defense preparation, compliance tracking, and audit trails",
      icon: Shield,
      color: "from-amber-500 to-orange-500",
      items: [
        { label: "Defense Studio", href: "/defense", icon: Shield },
        { label: "Governance & Audit", href: "/governance", icon: ShieldCheck },
      ]
    },
  ];

  if (user?.role === 'admin') {
    suiteCards.push({
      title: "PLATFORM",
      description: "System administration and model management",
      icon: Layers,
      color: "from-slate-500 to-gray-500",
      items: [
        { label: "Model Management", href: "/model-management", icon: Layers },
        { label: "User Management", href: "/admin/users", icon: Users },
      ]
    });
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-thin tracking-tight text-foreground">
            System Overview
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor system health and access all Suite modules
          </p>
        </div>

        {/* System-Wide KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Vitality</CardTitle>
              <Zap className="h-4 w-4 text-[#00FFFF]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemResonance.toFixed(3)}</div>
              <p className="text-xs text-muted-foreground flex items-center mt-1">
                <CheckCircle2 className="w-3 h-3 text-green-500 mr-1" />
                Quantum Core Active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Assessed Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$42.8B</div>
              <p className="text-xs text-muted-foreground flex items-center mt-1">
                <ArrowUpRight className="w-3 h-3 text-green-500 mr-1" />
                <span className="text-green-500 font-medium">+4.2%</span> from last year
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Jurisdictions</CardTitle>
              <MapIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground flex items-center mt-1">
                <CheckCircle2 className="w-3 h-3 text-green-500 mr-1" />
                All systems operational
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Processing Status</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isRevalRunning ? "Running" : "Idle"}</div>
              <p className="text-xs text-muted-foreground flex items-center mt-1">
                {isRevalRunning ? (
                  <>
                    <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping mr-2" />
                    Processing valuations
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-green-500 mr-1" />
                    Ready for next job
                  </>
                )}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Appeals Widget */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-[#00FFFF]" />
                  Recent Appeals
                </CardTitle>
                <CardDescription>Property tax appeal status overview</CardDescription>
              </div>
              <div className="flex gap-1">
                <Button 
                  size="sm" 
                  variant={dateRange === "7" ? "default" : "outline"}
                  onClick={() => setDateRange("7")}
                  className="h-7 px-2 text-xs"
                >
                  7d
                </Button>
                <Button 
                  size="sm" 
                  variant={dateRange === "30" ? "default" : "outline"}
                  onClick={() => setDateRange("30")}
                  className="h-7 px-2 text-xs"
                >
                  30d
                </Button>
                <Button 
                  size="sm" 
                  variant={dateRange === "90" ? "default" : "outline"}
                  onClick={() => setDateRange("90")}
                  className="h-7 px-2 text-xs"
                >
                  90d
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Status Counts */}
              <div className="grid grid-cols-5 gap-4">
                <button 
                  onClick={() => handleStatusClick('pending')}
                  className="text-center hover:bg-accent/50 rounded-lg p-2 transition-colors cursor-pointer"
                >
                  <div className="text-2xl font-bold text-foreground">{statusCounts?.pending ?? 0}</div>
                  <div className="text-xs text-muted-foreground">Pending</div>
                </button>
                <button 
                  onClick={() => handleStatusClick('in_review')}
                  className="text-center hover:bg-accent/50 rounded-lg p-2 transition-colors cursor-pointer"
                >
                  <div className="text-2xl font-bold text-foreground">{statusCounts?.in_review ?? 0}</div>
                  <div className="text-xs text-muted-foreground">In Review</div>
                </button>
                <button 
                  onClick={() => handleStatusClick('hearing_scheduled')}
                  className="text-center hover:bg-accent/50 rounded-lg p-2 transition-colors cursor-pointer"
                >
                  <div className="text-2xl font-bold text-foreground">{statusCounts?.hearing_scheduled ?? 0}</div>
                  <div className="text-xs text-muted-foreground">Hearing</div>
                </button>
                <button 
                  onClick={() => handleStatusClick('resolved')}
                  className="text-center hover:bg-accent/50 rounded-lg p-2 transition-colors cursor-pointer"
                >
                  <div className="text-2xl font-bold text-foreground">{statusCounts?.resolved ?? 0}</div>
                  <div className="text-xs text-muted-foreground">Resolved</div>
                </button>
                <button 
                  onClick={() => handleStatusClick('withdrawn')}
                  className="text-center hover:bg-accent/50 rounded-lg p-2 transition-colors cursor-pointer"
                >
                  <div className="text-2xl font-bold text-foreground">{statusCounts?.withdrawn ?? 0}</div>
                  <div className="text-xs text-muted-foreground">Withdrawn</div>
                </button>
              </div>
              
              {/* Recharts Sparkline */}
              <div className="h-16">
                {trendData && trendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <defs>
                        <linearGradient id="appealGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#00FFFF" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#00FFFF" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--popover))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '6px',
                          padding: '8px 12px'
                        }}
                        labelStyle={{ color: 'hsl(var(--popover-foreground))', fontSize: '12px' }}
                        itemStyle={{ color: '#00FFFF', fontSize: '12px' }}
                        formatter={(value: number) => [`${value} appeals`, 'Count']}
                        labelFormatter={(label: string) => `Date: ${label}`}
                      />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke="#00FFFF"
                        strokeWidth={2}
                        fill="url(#appealGradient)"
                        fillOpacity={1}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full bg-muted/20 rounded flex items-center justify-center text-xs text-muted-foreground">
                    No trend data available
                  </div>
                )}
              </div>
              
              <div className="flex justify-end">
                <Link href="/appeals">
                  <Button variant="outline" size="sm" className="gap-2">
                    View All Appeals
                    <ArrowUpRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Appeal Detail Modal */}
        <AppealDetailModal 
          open={appealModalOpen}
          onOpenChange={setAppealModalOpen}
          status={selectedStatus}
        />

        {/* Suite Quick-Access Cards */}
        <div>
          <h2 className="text-xl font-medium tracking-tight text-foreground mb-4">
            Suite Modules
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {suiteCards.map((suite) => (
              <Card key={suite.title} className="group hover:shadow-lg transition-all duration-300 cursor-pointer relative overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br ${suite.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <suite.icon className="w-5 h-5 text-[#00FFFF]" />
                        <CardTitle className="text-sm font-bold tracking-wide uppercase text-[#00FFFF]/80">
                          {suite.title}
                        </CardTitle>
                      </div>
                      <CardDescription className="text-sm">
                        {suite.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {suite.items.map((item) => (
                      <Link key={item.href} href={item.href}>
                        <div className="flex items-center justify-between p-2 rounded-md hover:bg-accent transition-colors group/item">
                          <div className="flex items-center gap-2">
                            <item.icon className="w-4 h-4 text-muted-foreground group-hover/item:text-[#00FFFF] transition-colors" />
                            <span className="text-sm text-foreground/80 group-hover/item:text-foreground transition-colors">
                              {item.label}
                            </span>
                          </div>
                          <ArrowUpRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover/item:opacity-100 transition-opacity" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest system actions and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { title: "Model Calibration Complete", time: "2 hours ago", type: "success" },
                { title: "New Sales Data Ingested", time: "5 hours ago", type: "info" },
                { title: "PRD Alert: Sector 7G", time: "1 day ago", type: "warning" },
                { title: "Weekly Backup Verified", time: "1 day ago", type: "success" },
              ].map((item, i) => (
                <div key={i} className="flex items-start pb-4 border-b border-border last:border-0 last:pb-0">
                  <div className={`w-2 h-2 mt-1.5 rounded-full mr-3 ${
                    item.type === 'success' ? 'bg-green-500' : 
                    item.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
