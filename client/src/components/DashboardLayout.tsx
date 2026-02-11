import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { AnimatedTerraLogo } from "./AnimatedTerraLogo";
import { ResonanceScore } from "./ResonanceScore";
import { useGlobalSimulation } from "@/contexts/GlobalSimulationContext";
import { CommandCenterMode } from "./CommandCenterMode";
import { VoiceCommandInterface } from "./VoiceCommandInterface";
import { DataIngestionPortal } from "./DataIngestionPortal";
import {
  BarChart3,
  Box,
  Brain,
  BrainCircuit,
  Calculator,
  ChevronRight,
  Factory,
  Home,
  Layers,
  LayoutDashboard,
  Map as MapIcon,
  Menu,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  TrendingUp,
  Sliders,
  Zap,
  Sun,
  Moon,
  Users,
  Upload
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";
import { PresenceIndicator } from "./PresenceIndicator";
import { useState as useReactState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useWebSocket } from "@/hooks/useWebSocket";
import { JobProvider, useJobDrawer } from "@/contexts/JobContext";
import { QuantumJobDrawer } from "./QuantumJobDrawer";
import { Briefcase } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/_core/hooks/useAuth";
import { Breadcrumb } from "./Breadcrumb";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [location] = useLocation();
  const { systemResonance, isRevalRunning, ingestData } = useGlobalSimulation();
  const { theme, toggleTheme } = useTheme();
  const [connectedUsers, setConnectedUsers] = useReactState(1);
  const { isConnected, subscribe } = useWebSocket({ autoConnect: true });
  const { user } = useAuth();
  
  // Subscribe to real-time presence updates
  useEffect(() => {
    const unsubJoined = subscribe('user:joined', (payload) => {
      if (payload.data.connectedCount) {
        setConnectedUsers(payload.data.connectedCount);
      }
    });
    
    const unsubLeft = subscribe('user:left', (payload) => {
      if (payload.data.connectedCount) {
        setConnectedUsers(payload.data.connectedCount);
      }
    });
    
    return () => {
      unsubJoined();
      unsubLeft();
    };
  }, [subscribe]);

  // Suite-based navigation structure
  const navSuites = [
    {
      title: "DATA SUITE",
      items: [
        { icon: Upload, label: "WA Data Ingestion", href: "/wa-data-ingestion" },
        { icon: LayoutDashboard, label: "County Dashboard", href: "/county-data-dashboard" },
        { icon: MapIcon, label: "Map Explorer", href: "/map-explorer" },
      ]
    },
    {
      title: "VALUATION SUITE",
      items: [
        { icon: Factory, label: "Mass Valuation Studio", href: "/mass-valuation" },
        { icon: Brain, label: "AVM Studio", href: "/avm-studio" },
        { icon: Zap, label: "Batch Valuation", href: "/batch-valuation" },
        { icon: Calculator, label: "Cost Matrix", href: "/cost-matrix" },
      ]
    },
    {
      title: "ANALYSIS SUITE",
      items: [
        { icon: BarChart3, label: "Market Analysis", href: "/analysis" },
        { icon: Sliders, label: "Calibration Studio", href: "/calibration" },
        { icon: TrendingUp, label: "Regression Studio", href: "/regression" },
        { icon: ShieldCheck, label: "QA / Ratio Studies", href: "/qa-ratio-studies" },
      ]
    },
    {
      title: "GOVERNANCE SUITE",
      items: [
        { icon: Shield, label: "Defense Studio", href: "/defense" },
        { icon: ShieldCheck, label: "Governance & Audit", href: "/governance" },
      ]
    },
    {
      title: "PLATFORM",
      adminOnly: true,
      items: [
        { icon: Layers, label: "Model Management", href: "/model-management" },
        { icon: Users, label: "User Management", href: "/admin/users" },
      ]
    },
  ];

  const [expandedSuites, setExpandedSuites] = useState<string[]>(["DATA SUITE", "VALUATION SUITE", "ANALYSIS SUITE", "GOVERNANCE SUITE"]);

  const toggleSuite = (suiteTitle: string) => {
    setExpandedSuites(prev =>
      prev.includes(suiteTitle)
        ? prev.filter(t => t !== suiteTitle)
        : [...prev, suiteTitle]
    );
  };

  // Generate breadcrumb items based on current route
  const getBreadcrumbItems = (path: string) => {
    const routeMap: Record<string, { suite: string; page: string }> = {
      '/wa-data-ingestion': { suite: 'Data Suite', page: 'WA Data Ingestion' },
      '/county-data-dashboard': { suite: 'Data Suite', page: 'County Dashboard' },
      '/map-explorer': { suite: 'Data Suite', page: 'Map Explorer' },
      '/mass-valuation': { suite: 'Valuation Suite', page: 'Mass Valuation Studio' },
      '/avm-studio': { suite: 'Valuation Suite', page: 'AVM Studio' },
      '/batch-valuation': { suite: 'Valuation Suite', page: 'Batch Valuation' },
      '/cost-matrix': { suite: 'Valuation Suite', page: 'Cost Matrix' },
      '/analysis': { suite: 'Analysis Suite', page: 'Market Analysis' },
      '/calibration': { suite: 'Analysis Suite', page: 'Calibration Studio' },
      '/regression': { suite: 'Analysis Suite', page: 'Regression Studio' },
      '/qa-ratio-studies': { suite: 'Analysis Suite', page: 'QA / Ratio Studies' },
      '/defense': { suite: 'Governance Suite', page: 'Defense Studio' },
      '/governance': { suite: 'Governance Suite', page: 'Governance & Audit' },
      '/model-management': { suite: 'Platform', page: 'Model Management' },
      '/admin/users': { suite: 'Platform', page: 'User Management' },
    };

    // Handle county detail dynamic routes
    if (path.startsWith('/county-detail/')) {
      const countyName = decodeURIComponent(path.split('/')[2]);
      return [
        { label: 'Data Suite', href: '/county-data-dashboard' },
        { label: countyName, href: path },
      ];
    }

    const route = routeMap[path];
    if (!route) return [];

    return [
      { label: route.suite, href: path },
      { label: route.page, href: path },
    ];
  };

  return (
    <div className="min-h-screen bg-background flex overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto border-r border-sidebar-border",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo Area */}
          <div className="h-20 flex items-center px-6 border-b border-[rgba(0,255,255,0.1)] bg-[rgba(0,255,255,0.02)]">
            <AnimatedTerraLogo size={48} className="mr-3" />
            <div>
              <h1 className="font-['SF_Pro_Display'] font-light text-2xl tracking-tight text-gradient-primary">TERRAFORGE</h1>
              <p className="text-[10px] text-cyan-400/70 uppercase tracking-[0.2em]">Native to TerraFusion OS</p>
            </div>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 py-6 px-4">
            <nav className="space-y-6">
              {navSuites
                .filter(suite => !suite.adminOnly || user?.role === 'admin')
                .map((suite) => (
                <div key={suite.title} className="space-y-2">
                  {/* Suite Header */}
                  <button
                    onClick={() => toggleSuite(suite.title)}
                    className="flex items-center w-full px-2 py-1.5 text-[10px] font-bold tracking-[0.15em] text-cyan-400/80 hover:text-cyan-400 transition-colors uppercase"
                  >
                    <ChevronRight
                      className={cn(
                        "w-3 h-3 mr-1.5 transition-transform duration-200",
                        expandedSuites.includes(suite.title) && "rotate-90"
                      )}
                    />
                    {suite.title}
                  </button>

                  {/* Suite Items */}
                  {expandedSuites.includes(suite.title) && (
                    <div className="space-y-0.5 pl-1">
                      {suite.items.map((item) => {
                        const isActive = location === item.href;
                        return (
                          <Link key={`${suite.title}-${item.href}`} href={item.href}>
                            <div
                              className={cn(
                                "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer group",
                                isActive
                                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                              )}
                            >
                              <item.icon
                                className={cn(
                                  "w-4 h-4 mr-3 transition-all duration-200",
                                  isActive ? "text-[#00FFFF]" : "text-slate-400 group-hover:text-[#00FFFF]"
                                )}
                              />
                              <span className={cn("text-[13px]", isActive ? "text-white font-medium" : "text-slate-300")}>
                                {item.label}
                              </span>
                              {isActive && <div className="ml-auto w-1 h-1 rounded-full bg-[#00FFFF] shadow-[0_0_8px_#00FFFF]" />}
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </nav>

            <div className="mt-12 px-3 flex flex-col items-center">
              <div className="p-4 rounded-xl bg-[rgba(0,255,255,0.03)] border border-[rgba(0,255,255,0.1)] relative overflow-hidden group w-full flex flex-col items-center">
                <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-[#00FFFF] to-transparent opacity-50" />
                <div className="flex items-center justify-between w-full mb-2">
                  <span className="text-[10px] uppercase tracking-widest text-cyan-400">System Vitality</span>
                  <span className="text-xs font-mono text-[#00FFFF]">{systemResonance.toFixed(3)}</span>
                </div>
                
                <ResonanceScore score={systemResonance} className="w-24 h-24 my-2 scale-75" />
                
                <div className="mt-2 flex items-center gap-2 self-start">
                  <div className={`w-2 h-2 rounded-full ${isRevalRunning ? "bg-amber-400 animate-ping" : "bg-[#00FF88] animate-pulse"}`} />
                  <span className="text-[10px] text-slate-400">{isRevalRunning ? "PROCESSING..." : "Quantum Core Active"}</span>
                </div>
              </div>
            </div>
          </ScrollArea>

          {/* User Profile */}
          <div className="p-4 border-t border-sidebar-border bg-sidebar-accent/5">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground font-bold">
                AI
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">Engineering Agent</p>
                <p className="text-xs text-sidebar-foreground/60">System Administrator</p>
              </div>
              <Settings className="w-4 h-4 ml-auto text-sidebar-foreground/50 hover:text-sidebar-foreground cursor-pointer" />
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-background border-b border-border flex items-center justify-between px-4 lg:px-8 sticky top-0 z-40">
          <div className="flex items-center gap-6">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden mr-4"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <Breadcrumb items={getBreadcrumbItems(location)} className="hidden lg:flex" />
            <div className="relative hidden md:block max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search properties, models, or metrics..."
                className="w-64 pl-9 pr-4 py-1.5 text-sm bg-muted/50 border border-input rounded-full focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <PresenceIndicator connectedUsers={connectedUsers} isConnected={isConnected} />
            <div className="hidden md:flex items-center px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium border border-primary/20">
              <Zap className="w-3 h-3 mr-1.5 fill-current" />
              System Operational
            </div>
            <DataIngestionPortal onDataLoaded={ingestData} />
            <CommandCenterMode />
            <VoiceCommandInterface />
            
            {/* Jobs Drawer Icon */}
            <JobsIconButton />
            
            {/* Theme Toggle */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleTheme}
              className="text-muted-foreground hover:text-primary"
              title={theme === 'dark' ? "Switch to Field Ops Mode (Light)" : "Switch to Command Center Mode (Dark)"}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>

            <Button variant="outline" size="sm" className="hidden sm:flex active-recoil hover-lift">
              Export Report
            </Button>
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 active-recoil hover-lift click-pulse relative overflow-hidden">
              New Valuation
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-muted/10 p-4 lg:p-8">
          <div className="container mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </main>
      </div>
      
      {/* Global Job Drawer */}
      <QuantumJobDrawer />
    </div>
  );
}

// Jobs Icon Button Component (must be inside JobProvider)
function JobsIconButton() {
  const { openDrawer } = useJobDrawer();
  const { data: jobs } = trpc.backgroundJobs.listMyJobs.useQuery(undefined, {
    refetchInterval: 5000, // Poll every 5s for active job count
  });

  const activeJobCount = jobs?.filter((j: any) => j.status === 'pending' || j.status === 'running').length || 0;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => openDrawer()}
      className="relative text-muted-foreground hover:text-primary"
      title="Background Jobs"
    >
      <Briefcase className="w-5 h-5" />
      {activeJobCount > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-primary text-primary-foreground"
        >
          {activeJobCount}
        </Badge>
      )}
    </Button>
  );
}
