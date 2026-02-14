import { useState } from "react";
import { useLocation } from "wouter";
import { LiquidPanel } from "./terra/LiquidPanel";
import { TactileButton } from "./terra/TactileButton";
import { Slider } from "./ui/slider";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { X, Settings, Filter, Zap, Database, Map as MapIcon, BarChart } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * ControlCenter - Context-Aware Quick Actions & Filters
 * 
 * TerraFusion OS Primitive:
 * - Right-side drawer that adapts content based on current page
 * - Provides quick toggles, filters, and contextual actions
 * - Uses glass materials for OS chrome
 */
export function ControlCenter() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  // Determine context based on current route
  const getContext = () => {
    if (location.includes("/assessment-review")) return "assessment";
    if (location.includes("/wa-data-ingestion")) return "data";
    if (location.includes("/map-explorer")) return "map";
    if (location.includes("/property-comparison")) return "comparison";
    return "default";
  };

  const context = getContext();

  return (
    <>
      {/* Trigger Button - Fixed Position */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed right-4 top-20 z-40",
          "w-12 h-12 rounded-full",
          "bg-glass-2 border border-glass-border",
          "flex items-center justify-center",
          "text-text-primary hover:bg-glass-3",
          "shadow-glass transition-all duration-200",
          "hover:scale-105"
        )}
        aria-label="Toggle Control Center"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Settings className="w-5 h-5" />}
      </button>

      {/* Control Center Drawer */}
      <div
        className={cn(
          "fixed right-0 top-0 h-screen w-80 z-30",
          "transform transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <LiquidPanel intensity={2} className="h-full p-6 space-y-6 overflow-y-auto">
          {/* Header */}
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Control Center
            </h2>
            <p className="text-sm text-text-secondary">
              {context === "assessment" && "Assessment Review Controls"}
              {context === "data" && "Data Ingestion Controls"}
              {context === "map" && "Map Explorer Controls"}
              {context === "comparison" && "Comparison Controls"}
              {context === "default" && "Quick Actions"}
            </p>
          </div>

          {/* Context-Specific Content */}
          {context === "assessment" && <AssessmentControls />}
          {context === "data" && <DataControls />}
          {context === "map" && <MapControls />}
          {context === "comparison" && <ComparisonControls />}
          {context === "default" && <DefaultControls />}
        </LiquidPanel>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

// Assessment Review Context
function AssessmentControls() {
  const [varianceThreshold, setVarianceThreshold] = useState([15]);
  const [statusFilter, setStatusFilter] = useState<string[]>(["pending", "flagged"]);

  const toggleStatus = (status: string) => {
    setStatusFilter(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  return (
    <div className="space-y-6">
      {/* Variance Threshold */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-text-primary">
            Variance Threshold
          </Label>
          <Badge variant="outline" className="text-signal-primary border-signal-primary">
            {varianceThreshold[0]}%
          </Badge>
        </div>
        <Slider
          value={varianceThreshold}
          onValueChange={setVarianceThreshold}
          min={5}
          max={30}
          step={1}
          className="w-full"
        />
        <p className="text-xs text-text-secondary">
          Show properties with ratio variance ≥ {varianceThreshold[0]}%
        </p>
      </div>

      {/* Status Filters */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-text-primary flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Status Filters
        </Label>
        <div className="flex flex-wrap gap-2">
          {["pending", "approved", "flagged"].map(status => (
            <button
              key={status}
              onClick={() => toggleStatus(status)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                statusFilter.includes(status)
                  ? "bg-signal-primary text-government-night-base"
                  : "bg-glass-2 text-text-secondary hover:bg-glass-3"
              )}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-text-primary">Quick Actions</Label>
        <TactileButton variant="glass" size="sm" className="w-full justify-start">
          <BarChart className="w-4 h-4 mr-2" />
          Export Report
        </TactileButton>
        <TactileButton variant="glass" size="sm" className="w-full justify-start">
          <Zap className="w-4 h-4 mr-2" />
          Bulk Approve
        </TactileButton>
      </div>
    </div>
  );
}

// Data Ingestion Context
function DataControls() {
  return (
    <div className="space-y-6">
      {/* Sync Status */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-text-primary flex items-center gap-2">
          <Database className="w-4 h-4" />
          Sync Status
        </Label>
        <div className="bg-glass-1 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">Last Sync</span>
            <span className="text-text-primary font-medium">2 hours ago</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">Data Quality</span>
            <Badge variant="outline" className="text-chart-4 border-chart-4">98.4%</Badge>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-text-primary">Quick Actions</Label>
        <TactileButton variant="neon" size="sm" className="w-full justify-start" commitment>
          <Zap className="w-4 h-4 mr-2" />
          Run Sync Now
        </TactileButton>
        <TactileButton variant="glass" size="sm" className="w-full justify-start">
          <Database className="w-4 h-4 mr-2" />
          View Logs
        </TactileButton>
      </div>
    </div>
  );
}

// Map Explorer Context
function MapControls() {
  const [layerToggles, setLayerToggles] = useState({
    parcels: true,
    sales: true,
    zoning: false,
    schools: false,
  });

  const toggleLayer = (layer: keyof typeof layerToggles) => {
    setLayerToggles(prev => ({ ...prev, [layer]: !prev[layer] }));
  };

  return (
    <div className="space-y-6">
      {/* Layer Toggles */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-text-primary flex items-center gap-2">
          <MapIcon className="w-4 h-4" />
          Map Layers
        </Label>
        <div className="space-y-2">
          {Object.entries(layerToggles).map(([layer, enabled]) => (
            <button
              key={layer}
              onClick={() => toggleLayer(layer as keyof typeof layerToggles)}
              className={cn(
                "w-full px-3 py-2 rounded-lg text-sm font-medium text-left transition-all",
                enabled
                  ? "bg-signal-primary text-government-night-base"
                  : "bg-glass-2 text-text-secondary hover:bg-glass-3"
              )}
            >
              {layer.charAt(0).toUpperCase() + layer.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-text-primary">Quick Actions</Label>
        <TactileButton variant="glass" size="sm" className="w-full justify-start">
          <Filter className="w-4 h-4 mr-2" />
          Spatial Query
        </TactileButton>
      </div>
    </div>
  );
}

// Property Comparison Context
function ComparisonControls() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label className="text-sm font-medium text-text-primary">Comparison Settings</Label>
        <div className="bg-glass-1 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">Selected</span>
            <span className="text-text-primary font-medium">0 properties</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium text-text-primary">Quick Actions</Label>
        <TactileButton variant="glass" size="sm" className="w-full justify-start">
          <BarChart className="w-4 h-4 mr-2" />
          Export Comparison
        </TactileButton>
      </div>
    </div>
  );
}

// Default Context
function DefaultControls() {
  return (
    <div className="space-y-6">
      <div className="text-sm text-text-secondary">
        Navigate to a specific page to see contextual controls and quick actions.
      </div>
    </div>
  );
}
