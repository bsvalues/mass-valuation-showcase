import * as React from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { LiquidPanel } from "./LiquidPanel";
import { TactileButton } from "./TactileButton";
import { useCommandHistory } from "@/hooks/useCommandHistory";
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
  Map,
  Scale,
  Brain,
  Calculator,
  Building2,
  LineChart,
  FileText,
  X,
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

/**
 * All navigable pages for the Command Palette
 */
interface NavItem {
  label: string;
  href: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  keywords: string[];
}

const ALL_NAV_ITEMS: NavItem[] = [
  { label: "Map Explorer", href: "/map-explorer", description: "Interactive property map with layers", icon: Map, keywords: ["map", "gis", "spatial", "parcel"] },
  { label: "Appeals Management", href: "/appeals", description: "Manage property tax appeals", icon: Scale, keywords: ["appeals", "protest", "hearing"] },
  { label: "Appeals Analytics", href: "/appeals/analytics", description: "Appeal statistics and trends", icon: BarChart3, keywords: ["analytics", "statistics", "trends"] },
  { label: "Assessment Review", href: "/assessment-review", description: "Review high-variance properties", icon: FileText, keywords: ["assessment", "review", "variance"] },
  { label: "Mass Appraisal Dashboard", href: "/mass-appraisal-dashboard", description: "County-wide quality metrics and ratio distribution", icon: Building2, keywords: ["mass appraisal", "cod", "prd", "county", "dashboard"] },
  { label: "Regression Studio", href: "/regression", description: "Statistical modeling and analysis", icon: TrendingUp, keywords: ["regression", "statistics", "modeling"] },
  { label: "Property Heatmap", href: "/property-heatmap", description: "Filter and visualize assessed values", icon: LineChart, keywords: ["heatmap", "property", "value", "filter"] },
  { label: "Ratio Study Analyzer", href: "/ratio-study-analyzer", description: "IAAO-standard ratio analysis", icon: Calculator, keywords: ["ratio", "cod", "prd", "iaao"] },
  { label: "Cluster Heatmap", href: "/cluster-map", description: "Spatial value cluster visualization", icon: Map, keywords: ["cluster", "heatmap", "spatial", "neighborhood"] },
  { label: "Value Driver Analysis", href: "/value-drivers", description: "Analyze factors driving property values", icon: Brain, keywords: ["value drivers", "factors", "regression"] },
  { label: "AVM Studio", href: "/avm-studio", description: "Automated valuation models", icon: Brain, keywords: ["avm", "machine learning", "prediction"] },
  { label: "Calibration Studio", href: "/calibration", description: "Calibrate valuation parameters", icon: Settings, keywords: ["calibration", "parameters", "tuning"] },
  { label: "Data Ingestion", href: "/wa-data-ingestion", description: "Upload and import parcel data", icon: Database, keywords: ["upload", "import", "csv", "data"] },
  { label: "Governance & Audit", href: "/governance", description: "Audit logs and compliance", icon: Shield, keywords: ["audit", "logs", "compliance"] },
  { label: "Defense Studio", href: "/defense", description: "Build appeal defense documents", icon: Shield, keywords: ["defense", "document", "appeal"] },
  { label: "Property Comparison", href: "/property-comparison", description: "Side-by-side property analysis", icon: Scale, keywords: ["compare", "comparison", "side by side"] },
  { label: "Market Analysis", href: "/analysis", description: "Market trends and sales analysis", icon: BarChart3, keywords: ["market", "sales", "trends"] },
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
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const [controlCenterOpen, setControlCenterOpen] = React.useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const { recentPages, recordNavigation } = useCommandHistory();

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

  // Focus input when palette opens; reset state when it closes
  React.useEffect(() => {
    if (commandPaletteOpen) {
      setSearchQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [commandPaletteOpen]);

  // Filtered nav items based on search query
  const filteredItems = React.useMemo(() => {
    if (!searchQuery.trim()) return ALL_NAV_ITEMS;
    const q = searchQuery.toLowerCase();
    return ALL_NAV_ITEMS.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.keywords.some((kw) => kw.includes(q))
    );
  }, [searchQuery]);

  // Reset selected index when filtered list changes
  React.useEffect(() => {
    setSelectedIndex(0);
  }, [filteredItems]);

  // Keyboard navigation inside the palette
  const handlePaletteKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filteredItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        const item = filteredItems[selectedIndex];
        recordNavigation(item.href, item.label);
        setLocation(item.href);
        setCommandPaletteOpen(false);
      }
    } else if (e.key === "Escape") {
      setCommandPaletteOpen(false);
    }
  };

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
                    <X className="w-5 h-5 text-text-secondary" />
                  </button>
                </div>

                <div className="space-y-3">
                  <p className="text-xs text-text-tertiary uppercase tracking-wider mb-3">Quick Access</p>
                  {ALL_NAV_ITEMS.slice(0, 8).map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setControlCenterOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-glass-1 text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                      >
                        <Icon className="w-4 h-4 text-signal-primary flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{item.label}</p>
                          <p className="text-xs text-text-tertiary truncate">{item.description}</p>
                        </div>
                      </Link>
                    );
                  })}
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
          className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/50 backdrop-blur-sm"
          onClick={() => setCommandPaletteOpen(false)}
        >
          <LiquidPanel
            intensity={3}
            neonBorder
            className="w-full max-w-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4" onKeyDown={handlePaletteKeyDown}>
              {/* Search Input */}
              <div className="flex items-center gap-3 mb-4">
                <Command className="w-5 h-5 text-signal-primary flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search pages, tools, workflows..."
                  className="flex-1 bg-transparent border-none outline-none text-text-primary placeholder:text-text-tertiary text-base"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="p-1 hover:bg-glass-1 rounded transition-colors"
                  >
                    <X className="w-4 h-4 text-text-tertiary" />
                  </button>
                )}
                <kbd
                  onClick={() => setCommandPaletteOpen(false)}
                  className="px-2 py-1 text-xs bg-glass-2 rounded border border-glass-border text-text-tertiary cursor-pointer hover:bg-glass-3 transition-colors"
                >
                  ESC
                </kbd>
              </div>

              {/* Divider */}
              <div className="h-px bg-glass-border mb-3" />

              {/* Results */}
              {filteredItems.length === 0 ? (
                <div className="py-6 text-center text-text-tertiary text-sm">
                  No pages found for "{searchQuery}"
                </div>
              ) : (
                <div className="space-y-0.5 max-h-72 overflow-y-auto">
                  {/* Recent pages section — shown only when no search query */}
                  {!searchQuery && recentPages.length > 0 && (
                    <>
                      <p className="text-xs text-text-tertiary uppercase tracking-wider px-3 py-1">
                        Recent — {recentPages.length} page{recentPages.length !== 1 ? "s" : ""}
                      </p>
                      {recentPages.map((page) => {
                        const match = ALL_NAV_ITEMS.find(n => n.href === page.href);
                        const Icon = match?.icon ?? FileText;
                        return (
                          <Link
                            key={`recent-${page.href}`}
                            href={page.href}
                            onClick={() => {
                              recordNavigation(page.href, page.label);
                              setCommandPaletteOpen(false);
                            }}
                            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-glass-1 text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                          >
                            <Icon className="w-4 h-4 flex-shrink-0 text-signal-secondary" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate">{page.label}</p>
                              <p className="text-xs text-text-tertiary truncate">{match?.description ?? page.href}</p>
                            </div>
                          </Link>
                        );
                      })}
                      <div className="h-px bg-glass-border my-2" />
                    </>
                  )}
                  {!searchQuery && (
                    <p className="text-xs text-text-tertiary uppercase tracking-wider px-3 py-1 mb-1">
                      All Pages — {filteredItems.length} available
                    </p>
                  )}
                  {searchQuery && (
                    <p className="text-xs text-text-tertiary uppercase tracking-wider px-3 py-1 mb-1">
                      {filteredItems.length} result{filteredItems.length !== 1 ? "s" : ""} for "{searchQuery}"
                    </p>
                  )}
                  {filteredItems.map((item, idx) => {
                    const Icon = item.icon;
                    const isSelected = idx === selectedIndex;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => {
                          recordNavigation(item.href, item.label);
                          setCommandPaletteOpen(false);
                        }}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer",
                          isSelected
                            ? "bg-signal-primary/10 border border-signal-primary/30 text-text-primary"
                            : "hover:bg-glass-1 text-text-secondary hover:text-text-primary"
                        )}
                        onMouseEnter={() => setSelectedIndex(idx)}
                      >
                        <Icon className={cn("w-4 h-4 flex-shrink-0", isSelected ? "text-signal-primary" : "text-text-tertiary")} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{item.label}</p>
                          <p className="text-xs text-text-tertiary truncate">{item.description}</p>
                        </div>
                        {isSelected && (
                          <ChevronRight className="w-3 h-3 text-signal-primary flex-shrink-0" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* Footer hint */}
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-glass-border text-xs text-text-tertiary">
                <span><kbd className="px-1.5 py-0.5 bg-glass-2 rounded border border-glass-border">↑↓</kbd> navigate</span>
                <span><kbd className="px-1.5 py-0.5 bg-glass-2 rounded border border-glass-border">↵</kbd> open</span>
                <span><kbd className="px-1.5 py-0.5 bg-glass-2 rounded border border-glass-border">ESC</kbd> close</span>
              </div>
            </div>
          </LiquidPanel>
        </div>
      )}
    </div>
  );
}
