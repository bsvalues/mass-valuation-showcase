import * as React from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { LiquidPanel } from "./LiquidPanel";
import { TactileButton } from "./TactileButton";
import {
  Database,
  BarChart3,
  TrendingUp,
  Shield,
  Settings,
  Search,
  Bell,
  User,
  ChevronRight,
  Command,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

/**
 * Suite Definition - "Apps" in the Dock
 */
interface Suite {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  color: string;
}

const SUITES: Suite[] = [
  {
    id: "data",
    label: "Data",
    icon: Database,
    href: "/wa-data-ingestion",
    color: "text-chart-1",
  },
  {
    id: "valuation",
    label: "Valuation",
    icon: TrendingUp,
    href: "/mass-valuation",
    color: "text-chart-2",
  },
  {
    id: "analysis",
    label: "Analysis",
    icon: BarChart3,
    href: "/analysis",
    color: "text-chart-3",
  },
  {
    id: "governance",
    label: "Governance",
    icon: Shield,
    href: "/governance",
    color: "text-chart-4",
  },
];

interface TerraFusionLayoutProps {
  children: React.ReactNode;
  /**
   * Current county context (displayed in Top System Bar)
   */
  county?: string;
  /**
   * Current tax year (displayed in Top System Bar)
   */
  taxYear?: string;
}

/**
 * TerraFusionLayout - Mac Tahoe OS Architecture
 * 
 * The 5 Layout Primitives:
 * 1. Dock Launcher (bottom) - Suite apps
 * 2. Top System Bar - County, Tax Year, Role, Command Palette
 * 3. Stage (Workspace) - Main content area
 * 4. Control Center - Quick toggles drawer (right side)
 * 5. Command Palette (⌘K) - Universal teleport
 * 
 * "3 Clicks to Value" Standard:
 * - Every action reachable via: Dock → Stage tabs → Command Palette
 * - If it takes 4 clicks, the architecture has failed
 */
export function TerraFusionLayout({
  children,
  county = "Washington",
  taxYear = "2026",
}: TerraFusionLayoutProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const [controlCenterOpen, setControlCenterOpen] = React.useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = React.useState(false);

  // Command Palette keyboard shortcut (⌘K or Ctrl+K)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-government-night-base">
      {/* Top System Bar - Primitive #2 */}
      <LiquidPanel
        intensity={2}
        className="flex-shrink-0 h-14 rounded-none border-x-0 border-t-0 flex items-center justify-between px-4"
      >
        {/* Left: Context */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-signal-primary to-signal-secondary flex items-center justify-center">
              <span className="text-xs font-bold text-government-night-base">TF</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-text-secondary">TerraFusion OS</span>
            </div>
          </div>
          
          <div className="h-6 w-px bg-glass-border" />
          
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1.5">
              <span className="text-text-secondary">County:</span>
              <span className="text-text-primary font-medium">{county}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-text-secondary">Tax Year:</span>
              <span className="text-text-primary font-medium">{taxYear}</span>
            </div>
            {user && (
              <div className="flex items-center gap-1.5">
                <span className="text-text-secondary">Role:</span>
                <span className="text-text-primary font-medium capitalize">{user.role}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Command Palette Trigger */}
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-glass-1 border border-glass-border hover:bg-glass-2 transition-colors text-sm text-text-secondary"
          >
            <Search className="w-4 h-4" />
            <span>Search</span>
            <kbd className="px-1.5 py-0.5 text-xs bg-glass-2 rounded border border-glass-border">⌘K</kbd>
          </button>

          <button className="p-2 rounded-lg hover:bg-glass-1 transition-colors">
            <Bell className="w-5 h-5 text-text-secondary" />
          </button>

          <button
            onClick={() => setControlCenterOpen(!controlCenterOpen)}
            className="p-2 rounded-lg hover:bg-glass-1 transition-colors"
          >
            <Settings className="w-5 h-5 text-text-secondary" />
          </button>

          {user && (
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-glass-1 border border-glass-border hover:bg-glass-2 transition-colors">
              <User className="w-4 h-4 text-text-secondary" />
              <span className="text-sm text-text-primary">{user.name}</span>
            </button>
          )}
        </div>
      </LiquidPanel>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Stage (Workspace) - Primitive #3 */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            {children}
          </div>
        </main>

        {/* Control Center - Primitive #4 */}
        {controlCenterOpen && (
          <div className="w-80 flex-shrink-0 border-l border-glass-border">
            <LiquidPanel intensity={1} className="h-full rounded-none border-0">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-text-primary">Control Center</h3>
                  <button
                    onClick={() => setControlCenterOpen(false)}
                    className="p-1 hover:bg-glass-1 rounded transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-text-secondary" />
                  </button>
                </div>
                
                <div className="space-y-3">
                  <div className="text-sm text-text-secondary">
                    Quick toggles and filters will appear here based on current context.
                  </div>
                </div>
              </div>
            </LiquidPanel>
          </div>
        )}
      </div>

      {/* Dock Launcher - Primitive #1 */}
      <LiquidPanel
        intensity={2}
        className="flex-shrink-0 h-20 rounded-none border-x-0 border-b-0 flex items-center justify-center"
      >
        <div className="flex items-center gap-3">
          {SUITES.map((suite) => {
            const Icon = suite.icon;
            const isActive = location.startsWith(suite.href);
            
            return (
              <Link key={suite.id} href={suite.href}>
                <button
                  className={cn(
                    "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all",
                    isActive
                      ? "bg-glass-3 border border-glass-border"
                      : "hover:bg-glass-1"
                  )}
                >
                  <Icon className={cn("w-6 h-6", isActive ? suite.color : "text-text-secondary")} />
                  <span className={cn(
                    "text-xs",
                    isActive ? "text-text-primary font-medium" : "text-text-secondary"
                  )}>
                    {suite.label}
                  </span>
                </button>
              </Link>
            );
          })}
        </div>
      </LiquidPanel>

      {/* Command Palette - Primitive #5 */}
      {commandPaletteOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/50 backdrop-blur-sm"
          onClick={() => setCommandPaletteOpen(false)}
        >
          <LiquidPanel
            intensity={3}
            neonBorder
            className="w-full max-w-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <Command className="w-5 h-5 text-signal-primary" />
                <input
                  type="text"
                  placeholder="Search for parcels, tools, or workflows..."
                  className="flex-1 bg-transparent border-none outline-none text-text-primary placeholder:text-text-tertiary"
                  autoFocus
                />
              </div>
              
              <div className="text-sm text-text-secondary">
                Command Palette coming soon - universal teleport to any parcel, tool, or scene
              </div>
            </div>
          </LiquidPanel>
        </div>
      )}
    </div>
  );
}
