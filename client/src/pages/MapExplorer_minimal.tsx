import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { trpc } from "@/lib/trpc";
import { Search, X, Layers, Ruler, Target, ChevronUp, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/**
 * Apple Maps-Inspired Map Explorer
 * 
 * Design Principles:
 * - Full-screen immersive map (no sidebars)
 * - Floating glass panels with backdrop blur
 * - Swipeable bottom sheet for property details
 * - Floating action buttons (FAB) for tools
 * - Minimal chrome, contextual overlays
 * - Smooth spring-physics animations
 * - Premium typography and spacing
 */

type BottomSheetState = "collapsed" | "half" | "full";

export default function MapExplorer() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  
  // State
  const [selectedProperty, setSelectedProperty] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [bottomSheetState, setBottomSheetState] = useState<BottomSheetState>("collapsed");
  const [fabExpanded, setFabExpanded] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(true);
  
  // Data
  const { data: allProperties } = trpc.parcels.list.useQuery();
  const properties = allProperties || [];
  
  // Filter properties
  const filteredProperties = properties.filter((p: any) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const address = (p.address || "").toLowerCase();
    const parcelNumber = (p.parcelId || "").toLowerCase();
    return address.includes(query) || parcelNumber.includes(query);
  });
  
  // Selected property data
  const selectedPropertyData = properties.find((p: any) => p.id === selectedProperty);
  
  // Neighborhood stats
  const { data: neighborhoodStats } = trpc.parcels.getNeighborhoodStats.useQuery(
    {
      latitude: parseFloat(selectedPropertyData?.latitude || "0"),
      longitude: parseFloat(selectedPropertyData?.longitude || "0"),
      radius: 1.0
    },
    { enabled: !!selectedPropertyData }
  );
  
  // Initialize map
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
            attribution: "© OpenStreetMap"
          }
        },
        layers: [{
          id: "osm",
          type: "raster",
          source: "osm"
        }]
      },
      center: [-119.2781, 46.2396],
      zoom: 12,
      attributionControl: false
    });
    
    map.current.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");
    
    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);
  
  // Add property markers with clustering
  useEffect(() => {
    if (!map.current || properties.length === 0) return;
    
    const mapInstance = map.current;
    
    mapInstance.on("load", () => {
      // GeoJSON source
      const geojson: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",
        features: properties.map((p: any) => ({
          type: "Feature",
          properties: { id: p.id, address: p.address, value: p.totalValue },
          geometry: {
            type: "Point",
            coordinates: [parseFloat(p.longitude), parseFloat(p.latitude)]
          }
        }))
      };
      
      if (!mapInstance.getSource("properties")) {
        mapInstance.addSource("properties", {
          type: "geojson",
          data: geojson,
          cluster: true,
          clusterRadius: 50,
          clusterMaxZoom: 14
        });
      }
      
      // Cluster circles
      if (!mapInstance.getLayer("clusters")) {
        mapInstance.addLayer({
          id: "clusters",
          type: "circle",
          source: "properties",
          filter: ["has", "point_count"],
          paint: {
            "circle-color": "#00D9D9",
            "circle-radius": ["step", ["get", "point_count"], 20, 10, 30, 30, 40],
            "circle-opacity": 0.8,
            "circle-stroke-width": 2,
            "circle-stroke-color": "#00FFEE"
          }
        });
      }
      
      // Cluster labels
      if (!mapInstance.getLayer("cluster-count")) {
        mapInstance.addLayer({
          id: "cluster-count",
          type: "symbol",
          source: "properties",
          filter: ["has", "point_count"],
          layout: {
            "text-field": "{point_count_abbreviated}",
            "text-font": ["Open Sans Semibold"],
            "text-size": 14
          },
          paint: { "text-color": "#ffffff" }
        });
      }
      
      // Unclustered points
      if (!mapInstance.getLayer("unclustered-point")) {
        mapInstance.addLayer({
          id: "unclustered-point",
          type: "circle",
          source: "properties",
          filter: ["!", ["has", "point_count"]],
          paint: {
            "circle-color": "#00D9D9",
            "circle-radius": 8,
            "circle-stroke-width": 2,
            "circle-stroke-color": "#00FFEE",
            "circle-opacity": 0.9
          }
        });
      }
      
      // Click handler for unclustered points
      mapInstance.on("click", "unclustered-point", (e) => {
        if (!e.features || e.features.length === 0) return;
        const feature = e.features[0];
        const propertyId = feature.properties?.id;
        if (propertyId) {
          setSelectedProperty(propertyId);
          setBottomSheetState("half");
          
          // Fly to property
          const coords = (feature.geometry as any).coordinates;
          mapInstance.flyTo({
            center: coords,
            zoom: 15,
            duration: 1000,
            easing: (t) => t * (2 - t) // Ease out quad
          });
        }
      });
      
      // Click handler for clusters
      mapInstance.on("click", "clusters", (e) => {
        if (!e.features || e.features.length === 0) return;
        const features = mapInstance.queryRenderedFeatures(e.point, { layers: ["clusters"] });
        const clusterId = features[0].properties?.cluster_id;
        const source = mapInstance.getSource("properties") as maplibregl.GeoJSONSource;
        
        source.getClusterExpansionZoom(clusterId).then((zoom) => {
          mapInstance.easeTo({
            center: (features[0].geometry as any).coordinates,
            zoom: zoom,
            duration: 500
          });
        }).catch(() => {});
      });
      
      // Cursor styles
      mapInstance.on("mouseenter", "clusters", () => { mapInstance.getCanvas().style.cursor = "pointer"; });
      mapInstance.on("mouseleave", "clusters", () => { mapInstance.getCanvas().style.cursor = ""; });
      mapInstance.on("mouseenter", "unclustered-point", () => { mapInstance.getCanvas().style.cursor = "pointer"; });
      mapInstance.on("mouseleave", "unclustered-point", () => { mapInstance.getCanvas().style.cursor = ""; });
    });
  }, [properties]);
  
  // Bottom sheet height calculation
  const getBottomSheetHeight = () => {
    switch (bottomSheetState) {
      case "collapsed": return "80px";
      case "half": return "50vh";
      case "full": return "90vh";
    }
  };
  
  // Handle bottom sheet swipe
  const handleBottomSheetSwipe = () => {
    if (bottomSheetState === "collapsed") setBottomSheetState("half");
    else if (bottomSheetState === "half") setBottomSheetState("full");
    else setBottomSheetState("half");
  };
  
  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* Full-screen Map */}
      <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
      
      {/* Floating Search Bar */}
      {showSearchBar && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 w-full max-w-2xl px-6 z-30 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="relative bg-black/40 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/10">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-cyan-400" />
            <Input
              type="text"
              placeholder="Search by address or parcel number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className="pl-12 pr-12 py-6 bg-transparent border-0 text-white placeholder:text-gray-400 text-lg focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
          
          {/* Search Results Dropdown */}
          {searchFocused && filteredProperties.length > 0 && searchQuery && (
            <div className="mt-2 bg-black/60 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/10 max-h-96 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-300">
              {filteredProperties.slice(0, 8).map((p: any) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedProperty(p.id);
                    setBottomSheetState("half");
                    setSearchQuery("");
                    map.current?.flyTo({
                      center: [parseFloat(p.longitude), parseFloat(p.latitude)],
                      zoom: 15,
                      duration: 1000
                    });
                  }}
                  className="w-full px-6 py-4 text-left hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                >
                  <div className="text-white font-medium">{p.address}</div>
                  <div className="text-sm text-gray-400 mt-1">
                    {p.parcelId} • ${(p.totalValue || 0).toLocaleString()}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Floating Action Buttons (Right Edge) */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-3">
        {/* GIS Tools FAB */}
        <button
          onClick={() => setFabExpanded(!fabExpanded)}
          className="w-14 h-14 rounded-full bg-cyan-500/20 backdrop-blur-xl border border-cyan-400/30 flex items-center justify-center text-cyan-400 hover:bg-cyan-500/30 hover:scale-110 transition-all duration-300 shadow-lg shadow-cyan-500/20"
        >
          <Layers className="h-6 w-6" />
        </button>
        
        {/* Measurement Tool FAB */}
        <button
          className="w-14 h-14 rounded-full bg-cyan-500/20 backdrop-blur-xl border border-cyan-400/30 flex items-center justify-center text-cyan-400 hover:bg-cyan-500/30 hover:scale-110 transition-all duration-300 shadow-lg shadow-cyan-500/20"
        >
          <Ruler className="h-6 w-6" />
        </button>
        
        {/* Spatial Query FAB */}
        <button
          className="w-14 h-14 rounded-full bg-cyan-500/20 backdrop-blur-xl border border-cyan-400/30 flex items-center justify-center text-cyan-400 hover:bg-cyan-500/30 hover:scale-110 transition-all duration-300 shadow-lg shadow-cyan-500/20"
        >
          <Target className="h-6 w-6" />
        </button>
      </div>
      
      {/* Swipeable Bottom Sheet */}
      <div
        className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-2xl rounded-t-3xl shadow-2xl border-t border-white/10 transition-all duration-500 ease-out z-40"
        style={{ height: getBottomSheetHeight() }}
      >
        {/* Drag Handle */}
        <button
          onClick={handleBottomSheetSwipe}
          className="w-full py-4 flex items-center justify-center cursor-pointer hover:bg-white/5 transition-colors"
        >
          <div className="w-12 h-1.5 bg-gray-600 rounded-full" />
        </button>
        
        {/* Bottom Sheet Content */}
        <div className="px-6 pb-6 overflow-y-auto" style={{ height: "calc(100% - 56px)" }}>
          {selectedPropertyData ? (
            <div className="space-y-6">
              {/* Property Header */}
              <div>
                <h2 className="text-2xl font-semibold text-white mb-2">
                  {selectedPropertyData.address}
                </h2>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="bg-cyan-500/20 text-cyan-400 border-cyan-400/30">
                    {selectedPropertyData.parcelId}
                  </Badge>
                  <Badge variant="outline" className="bg-cyan-500/20 text-cyan-400 border-cyan-400/30">
                    {selectedPropertyData.propertyType || "Residential"}
                  </Badge>
                </div>
              </div>
              
              {/* Property Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="text-gray-400 text-sm mb-1">Assessed Value</div>
                  <div className="text-white text-2xl font-semibold">
                    ${(selectedPropertyData.totalValue || 0).toLocaleString()}
                  </div>
                </div>
                
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="text-gray-400 text-sm mb-1">Year Built</div>
                  <div className="text-white text-2xl font-semibold">
                    {selectedPropertyData.yearBuilt || "N/A"}
                  </div>
                </div>
                
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="text-gray-400 text-sm mb-1">Land Value</div>
                  <div className="text-white text-2xl font-semibold">
                    ${(selectedPropertyData.landValue || 0).toLocaleString()}
                  </div>
                </div>
                
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="text-gray-400 text-sm mb-1">Building Value</div>
                  <div className="text-white text-2xl font-semibold">
                    ${(selectedPropertyData.buildingValue || 0).toLocaleString()}
                  </div>
                </div>
              </div>
              
              {/* Neighborhood Stats */}
              {neighborhoodStats && bottomSheetState === "full" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Neighborhood Statistics (1-mile radius)</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <div className="text-gray-400 text-sm mb-1">Median Value</div>
                      <div className="text-white text-xl font-semibold">
                        ${neighborhoodStats.medianValue.toLocaleString()}
                      </div>
                    </div>
                    
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <div className="text-gray-400 text-sm mb-1">Avg Square Footage</div>
                      <div className="text-white text-xl font-semibold">
                        {neighborhoodStats.avgSquareFootage.toLocaleString()} sq ft
                      </div>
                    </div>
                    
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <div className="text-gray-400 text-sm mb-1">Price per Sq Ft</div>
                      <div className="text-white text-xl font-semibold">
                        ${neighborhoodStats.avgPricePerSqFt.toFixed(2)}
                      </div>
                    </div>
                    
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <div className="text-gray-400 text-sm mb-1">Average Age</div>
                      <div className="text-white text-xl font-semibold">
                        {neighborhoodStats.avgAge.toFixed(1)} years
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-gray-400 text-lg mb-2">Select a property to view details</div>
                <div className="text-gray-500 text-sm">Click on any marker on the map</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
