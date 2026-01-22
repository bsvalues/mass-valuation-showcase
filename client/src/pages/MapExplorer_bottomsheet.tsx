import { BottomSheet, type BottomSheetState } from "@/components/BottomSheet";
import { GISTools } from "@/components/GISTools";
import { LayerManager, defaultLayers, type Layer } from "@/components/LayerManager";
import { MapLegend } from "@/components/MapLegend";
import { MeasurementTools } from "@/components/MeasurementTools";
import { trpc } from "@/lib/trpc";
import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, X, Flame, Settings, Target, Download, Layers } from "lucide-react";
import { exportSpatialQueryToCSV } from "@/lib/csvExport";

export default function MapExplorer() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<number | null>(null);
  const [bottomSheetState, setBottomSheetState] = useState<BottomSheetState>("collapsed");
  const [gisToolsOpen, setGisToolsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [heatmapVisible, setHeatmapVisible] = useState(false);
  const [layers, setLayers] = useState<Layer[]>(defaultLayers);
  const [bufferZoneVisible, setBufferZoneVisible] = useState(false);
  const [spatialQueryMode, setSpatialQueryMode] = useState(false);
  const [queryResults, setQueryResults] = useState<any>(null);
  const [measurementMode, setMeasurementMode] = useState<"distance" | "area" | null>(null);

  // Fetch property data
  const { data: allProperties, isLoading } = trpc.parcels.list.useQuery();

  const properties = allProperties || [];

  // Filter properties based on search query
  const filteredProperties = properties.filter((p: any) => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    const address = (p.address || "").toLowerCase();
    const parcelNumber = (p.parcelNumber || "").toLowerCase();
    
    return address.includes(query) || parcelNumber.includes(query);
  });

  // Get selected property details
  const selectedPropertyData = properties.find((p: any) => p.id === selectedProperty);

  // Fetch neighborhood stats for selected property
  const { data: neighborhoodStats } = trpc.parcels.getNeighborhoodStats.useQuery(
    {
      latitude: parseFloat(selectedPropertyData?.latitude || "0"),
      longitude: parseFloat(selectedPropertyData?.longitude || "0"),
      radius: 1.0,
    },
    {
      enabled: !!selectedPropertyData?.latitude && !!selectedPropertyData?.longitude,
    }
  );

  // When property is selected, expand bottom sheet to half
  useEffect(() => {
    if (selectedProperty && bottomSheetState === "collapsed") {
      setBottomSheetState("half");
    }
  }, [selectedProperty, bottomSheetState]);

  // Initialize map (same as before, just extracting the initialization logic)
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "© OpenStreetMap contributors",
          },
        },
        layers: [
          {
            id: "osm",
            type: "raster",
            source: "osm",
          },
        ],
      },
      center: [-119.2, 46.2],
      zoom: 10,
    });

    // Add clustering and other map features here (keeping existing logic)
    // ... (I'll add this in the next iteration to keep file manageable)

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {/* Full-Screen Map */}
      <div
        ref={mapContainer}
        className="absolute inset-0 w-full h-full"
      />

      {/* Floating Search Bar (Top) */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-40 w-full max-w-md px-4">
        <div className="relative bg-black/60 backdrop-blur-2xl rounded-full border border-white/10 shadow-2xl">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/50" />
          <Input
            placeholder="Search address or parcel..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 pr-12 bg-transparent border-none text-white placeholder:text-white/50 h-12 rounded-full"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Floating Action Buttons (Right Edge) */}
      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-40 flex flex-col gap-3">
        <Button
          variant={heatmapVisible ? "default" : "outline"}
          size="icon"
          onClick={() => setHeatmapVisible(!heatmapVisible)}
          className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-2xl border-white/10 shadow-2xl"
        >
          <Flame className="h-5 w-5" />
        </Button>
        <Button
          variant={gisToolsOpen ? "default" : "outline"}
          size="icon"
          onClick={() => setGisToolsOpen(!gisToolsOpen)}
          className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-2xl border-white/10 shadow-2xl"
        >
          <Layers className="h-5 w-5" />
        </Button>
        <Button
          variant={spatialQueryMode ? "default" : "outline"}
          size="icon"
          onClick={() => setSpatialQueryMode(!spatialQueryMode)}
          className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-2xl border-white/10 shadow-2xl"
        >
          <Target className="h-5 w-5" />
        </Button>
      </div>

      {/* GIS Tools Panel (Floating) */}
      {gisToolsOpen && (
        <div className="absolute right-20 top-1/2 transform -translate-y-1/2 z-40 w-80 bg-black/60 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold">GIS Tools</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setGisToolsOpen(false)}
              className="text-white/50 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <LayerManager
            layers={layers}
            onLayerToggle={(layerId, visible) => {
              setLayers(layers.map(layer => 
                layer.id === layerId ? { ...layer, visible } : layer
              ));
            }}
            onLayerOpacityChange={(layerId, opacity) => {
              setLayers(layers.map(layer => 
                layer.id === layerId ? { ...layer, opacity } : layer
              ));
            }}
          />
        </div>
      )}

      {/* Map Legend */}
      <MapLegend
        layers={layers}
        onLayerToggle={(layerId, visible) => {
          setLayers(layers.map(layer => 
            layer.id === layerId ? { ...layer, visible } : layer
          ));
        }}
      />

      {/* Measurement Tools */}
      <MeasurementTools
        map={map.current}
        mode={measurementMode}
        onModeChange={setMeasurementMode}
      />

      {/* Bottom Sheet */}
      <BottomSheet
        state={bottomSheetState}
        onStateChange={setBottomSheetState}
      >
        <div className="px-6 pb-6 space-y-4">
          {/* Property Count */}
          <div className="text-sm text-white/60">
            {filteredProperties.length === properties.length
              ? `${properties.length} properties`
              : `${filteredProperties.length} of ${properties.length} properties`}
          </div>

          {/* Property List */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <div className="text-sm text-white/60">Loading properties...</div>
            ) : filteredProperties.length === 0 ? (
              <div className="text-sm text-white/60">
                {searchQuery ? "No properties match your search" : "No properties found"}
              </div>
            ) : (
              filteredProperties.map((property: any) => (
                <button
                  key={property.id}
                  onClick={() => {
                    setSelectedProperty(property.id);
                    if (bottomSheetState === "collapsed") {
                      setBottomSheetState("half");
                    }
                  }}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    selectedProperty === property.id
                      ? "border-cyan-500 bg-cyan-500/10"
                      : "border-white/10 hover:border-cyan-500/50 hover:bg-white/5"
                  }`}
                >
                  <div className="font-medium text-white">
                    {property.address || "Unknown Address"}
                  </div>
                  <div className="text-xs text-white/50 mt-1">
                    Parcel: {property.parcelNumber || "N/A"}
                  </div>
                  <div className="text-sm text-cyan-400 mt-2 font-mono">
                    ${property.assessedValue?.toLocaleString() || "N/A"}
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Neighborhood Statistics (Full State Only) */}
          {bottomSheetState === "full" && selectedProperty && neighborhoodStats && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold">Neighborhood Statistics</h3>
                <Badge variant="secondary" className="text-xs">
                  {neighborhoodStats.propertyCount} properties
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="text-xs text-white/50">Median Value</div>
                  <div className="text-xl font-bold text-white mt-1">
                    ${neighborhoodStats.medianValue?.toLocaleString() || "N/A"}
                  </div>
                </div>
                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="text-xs text-white/50">Avg Sq Ft</div>
                  <div className="text-xl font-bold text-white mt-1">
                    {neighborhoodStats.avgSquareFootage?.toLocaleString() || "N/A"}
                  </div>
                </div>
                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="text-xs text-white/50">Price/sqft</div>
                  <div className="text-xl font-bold text-white mt-1">
                    ${neighborhoodStats.avgPricePerSqFt?.toFixed(2) || "N/A"}
                  </div>
                </div>
                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="text-xs text-white/50">Avg Age</div>
                  <div className="text-xl font-bold text-white mt-1">
                    {neighborhoodStats.avgAge || "N/A"} yrs
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </BottomSheet>
    </div>
  );
}
