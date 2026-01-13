import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { AnimatedTerraLogo } from "./AnimatedTerraLogo";
import { ResonanceScore } from "./ResonanceScore";
import { CommandCenterMode } from "./CommandCenterMode";
import { VoiceCommandInterface } from "./VoiceCommandInterface";
import {
  BarChart3,
  Box,
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
  Sliders,
  Zap
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [location] = useLocation();

  const navItems = [
    { icon: Home, label: "Overview", href: "/" },
    { icon: Sliders, label: "Calibration Studio", href: "/calibration" },
    { icon: Calculator, label: "Cost Matrix", href: "/cost-matrix" },
    { icon: Factory, label: "Mass Valuation Studio", href: "/mass-valuation" },
    { icon: BarChart3, label: "Market Analysis", href: "/analysis" },
    { icon: MapIcon, label: "Map Explorer", href: "/map-explorer" },
    { icon: Box, label: "Models & Algorithms", href: "/models" },
    { icon: Shield, label: "Defense Studio", href: "/defense" },
    { icon: ShieldCheck, label: "Governance & Audit", href: "/governance" },
    { icon: BrainCircuit, label: "The Neural Core", href: "/neural-core" },
  ];

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
              <h1 className="font-['SF_Pro_Display'] font-light text-2xl tracking-tight text-gradient-primary">TERRAFUSION</h1>
              <p className="text-[10px] text-cyan-400/70 uppercase tracking-[0.2em]">Quantum Gov OS</p>
            </div>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 py-6 px-4">
            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = location === item.href;
                return (
                  <Link key={item.href} href={item.href}>
                    <div
                      className={cn(
                        "flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-300 ease-golden cursor-pointer group hover:translate-x-1",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "w-5 h-5 mr-3 transition-all duration-300 ease-golden",
                          isActive ? "text-[#00FFFF] scale-110" : "text-slate-400 group-hover:text-[#00FFFF] group-hover:scale-110"
                        )}
                      />
                      <span className={cn("tracking-wide", isActive ? "text-white" : "text-slate-300")}>
                        {item.label}
                      </span>
                      {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#00FFFF] shadow-[0_0_10px_#00FFFF]" />}
                    </div>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-12 px-3 flex flex-col items-center">
              <div className="p-4 rounded-xl bg-[rgba(0,255,255,0.03)] border border-[rgba(0,255,255,0.1)] relative overflow-hidden group w-full flex flex-col items-center">
                <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-[#00FFFF] to-transparent opacity-50" />
                <div className="flex items-center justify-between w-full mb-2">
                  <span className="text-[10px] uppercase tracking-widest text-cyan-400">System Vitality</span>
                  <span className="text-xs font-mono text-[#00FFFF]">12.000</span>
                </div>
                
                <ResonanceScore score={12.000} className="w-24 h-24 my-2 scale-75" />
                
                <div className="mt-2 flex items-center gap-2 self-start">
                  <div className="w-2 h-2 rounded-full bg-[#00FF88] animate-pulse" />
                  <span className="text-[10px] text-slate-400">Quantum Core Active</span>
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
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden mr-4"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="w-5 h-5" />
            </Button>
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
            <div className="hidden md:flex items-center px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium border border-primary/20">
              <Zap className="w-3 h-3 mr-1.5 fill-current" />
              System Operational
            </div>
            <CommandCenterMode />
            <VoiceCommandInterface />
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
    </div>
  );
}
