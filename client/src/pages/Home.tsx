import { useAuth } from "@/_core/hooks/useAuth";
import { DashboardLayout } from "@/components/DashboardLayout";
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
import { useGlobalSimulation } from "@/contexts/GlobalSimulationContext";

export default function Home() {
  const { user, loading, error, isAuthenticated } = useAuth();
  const { systemResonance, isRevalRunning } = useGlobalSimulation();

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
