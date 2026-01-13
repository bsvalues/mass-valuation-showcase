import { DashboardLayout } from "@/components/DashboardLayout";
import { MapView } from "@/components/Map";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Layers, Map as MapIcon, MousePointer2, Navigation, Search, Settings2, Zap, Network } from "lucide-react";
import { useState, useEffect } from "react";
import { useGlobalSimulation } from "@/contexts/GlobalSimulationContext";
import { toast } from "sonner";
import { performKMeansClustering } from "@/lib/clustering";

export default function MapExplorer() {
  const [activeLayer, setActiveLayer] = useState("valuation");
  const [is3DMode, setIs3DMode] = useState(true);
  const [isSwarmMode, setIsSwarmMode] = useState(false);
  const [clusters, setClusters] = useState<any[]>([]);
  const { realData, hasRealData } = useGlobalSimulation();

  useEffect(() => {
    if (hasRealData) {
      toast.success("Map Data Hydrated", {
        description: `Visualizing ${realData.length.toLocaleString()} parcels from uploaded tax roll.`
      });
      
      // Auto-run clustering when data loads
      const calculatedClusters = performKMeansClustering(realData, 5);
      setClusters(calculatedClusters);
    }
  }, [hasRealData, realData.length]);

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-4">
        {/* Sidebar Controls */}
        <Card className="w-full lg:w-80 flex flex-col terra-card bg-[rgba(10,14,26,0.8)] border-r border-[rgba(0,255,255,0.1)]">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-[#00FFFF]">
              <MapIcon className="w-5 h-5" />
              TerraGAMA GIS
            </CardTitle>
            <CardDescription className="text-xs">
              Geospatial Assisted Mass Appraisal
            </CardDescription>
          </CardHeader>
          
          <ScrollArea className="flex-1 px-6">
            <div className="space-y-6">
              {/* Layer Selection */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Layers className="w-3 h-3" /> Active Layers
                </h3>
                <div className="space-y-2">
                  {[
                    { id: "valuation", label: "Valuation Heatmap", color: "bg-blue-500" },
                    { id: "sales", label: "Recent Sales", color: "bg-green-500" },
                    { id: "parcels", label: "Parcel Boundaries", color: "bg-slate-500" },
                    { id: "zoning", label: "Zoning Districts", color: "bg-purple-500" },
                  ].map((layer) => (
                    <div 
                      key={layer.id}
                      className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-all duration-200 ${
                        activeLayer === layer.id 
                          ? "bg-[rgba(0,255,255,0.1)] border border-[rgba(0,255,255,0.2)]" 
                          : "hover:bg-white/5 border border-transparent"
                      }`}
                      onClick={() => setActiveLayer(layer.id)}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${layer.color}`} />
                        <span className="text-sm">{layer.label}</span>
                      </div>
                      <Switch checked={activeLayer === layer.id} />
                    </div>
                  ))}
                </div>
              </div>

              <Separator className="bg-white/10" />

              {/* Analysis Tools */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Zap className="w-3 h-3" /> Spatial Analysis
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="justify-start text-xs h-8 active-recoil">
                    <MousePointer2 className="w-3 h-3 mr-2" /> Select
                  </Button>
                  <Button variant="outline" size="sm" className="justify-start text-xs h-8 active-recoil">
                    <Navigation className="w-3 h-3 mr-2" /> Buffer
                  </Button>
                  <Button variant="outline" size="sm" className="justify-start text-xs h-8 active-recoil">
                    <Search className="w-3 h-3 mr-2" /> Query
                  </Button>
                  <Button variant="outline" size="sm" className="justify-start text-xs h-8 active-recoil">
                    <Settings2 className="w-3 h-3 mr-2" /> Filter
                  </Button>
                </div>
              </div>

              {/* 3D Controls */}
              <div className="p-3 rounded-lg bg-gradient-to-br from-blue-900/20 to-cyan-900/20 border border-cyan-500/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-cyan-400">3D Terrain Mode</span>
                  <Switch checked={is3DMode} onCheckedChange={setIs3DMode} />
                </div>
                <p className="text-[10px] text-slate-400">
                  Enable WebGL terrain extrusion based on property value density.
                </p>
              </div>

              {/* Swarm Controls */}
              <div className={`p-3 rounded-lg border transition-all duration-500 ${isSwarmMode ? 'bg-[#00ffee]/10 border-[#00ffee]/50 shadow-[0_0_15px_rgba(0,255,238,0.2)]' : 'bg-white/5 border-white/10'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-medium flex items-center gap-2 ${isSwarmMode ? 'text-[#00ffee]' : 'text-slate-300'}`}>
                    <Zap className={`w-4 h-4 ${isSwarmMode ? 'animate-pulse' : ''}`} />
                    Swarm Visualization
                  </span>
                  <Switch checked={isSwarmMode} onCheckedChange={setIsSwarmMode} />
                </div>
                <p className="text-[10px] text-slate-400">
                  Visualize the "Million Agent Consciousness" and synaptic connections between comparable properties.
                </p>
                {isSwarmMode && (
                  <div className="mt-2 space-y-1">
                    <div className="text-[10px] font-mono text-[#00ffee] animate-pulse">
                      &gt; SYNAPSES ACTIVE: {hasRealData ? (realData.length * 3.5).toLocaleString(undefined, {maximumFractionDigits: 0}) : "42,891"}
                    </div>
                    {clusters.length > 0 && (
                      <div className="text-[10px] font-mono text-purple-400">
                        &gt; CLUSTERS IDENTIFIED: {clusters.length}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        </Card>

        {/* Main Map View */}
        <Card className="flex-1 terra-card overflow-hidden relative border-0">
          <div className="absolute inset-0 bg-slate-900">
            <MapView 
              className="w-full h-full"
              onMapReady={(map) => {
                console.log("TerraGAMA Map Ready", map);
                // Future: Add TerraGAMA layers here
              }}
            />
            
            {/* Map Overlay Controls */}
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              <Button size="icon" variant="secondary" className="rounded-full shadow-lg bg-black/50 backdrop-blur-md border border-white/10 hover:bg-black/70">
                <Navigation className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="secondary" className="rounded-full shadow-lg bg-black/50 backdrop-blur-md border border-white/10 hover:bg-black/70">
                <Layers className="w-4 h-4" />
              </Button>
            </div>

            {/* Legend Overlay */}
            <div className="absolute bottom-4 right-4 p-4 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 shadow-xl max-w-[200px]">
              <h4 className="text-xs font-bold mb-2 text-white">Valuation Density</h4>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] text-slate-300">
                  <span>High</span>
                  <div className="w-20 h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-red-500 rounded-full" />
                  <span>Low</span>
                </div>
                {hasRealData && (
                  <div className="mt-2 pt-2 border-t border-white/10">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Parcels Loaded:</span>
                      <span className="text-[#00ffee]">{realData.length.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Swarm Overlay */}
            {isSwarmMode && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="relative w-full h-full overflow-hidden opacity-30">
                  <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] -translate-x-1/2 -translate-y-1/2 border border-[#00ffee] rounded-full animate-[ping_4s_linear_infinite]" />
                  <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] -translate-x-1/2 -translate-y-1/2 border border-[#00ffee] rounded-full animate-[ping_4s_linear_infinite_1s]" />
                  <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] -translate-x-1/2 -translate-y-1/2 border border-[#00ffee] rounded-full animate-[ping_4s_linear_infinite_2s]" />
                  
                  {/* Render Clusters */}
                  {clusters.map((cluster, i) => (
                    <div 
                      key={i}
                      className="absolute w-4 h-4 bg-purple-500 rounded-full animate-pulse shadow-[0_0_20px_#a855f7]"
                      style={{
                        top: `${50 + (cluster.centroid.lat - 25.7617) * 200}%`,
                        left: `${50 + (cluster.centroid.lng - (-80.1918)) * 200}%`
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
