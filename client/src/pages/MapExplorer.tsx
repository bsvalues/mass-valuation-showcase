import { useEffect, useRef, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import "mapbox-gl/dist/mapbox-gl.css";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Layers, MapPin, TrendingUp, Home as HomeIcon, Maximize2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// MapLibre GL JS - free and open source, no API key required

export default function MapExplorer() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<number | null>(null);
  const [selectedPropertyData, setSelectedPropertyData] = useState<any>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const circleLayerRef = useRef<string | null>(null);
  
  // Fetch property data for heatmap
  const { data: allProperties, isLoading } = trpc.parcels.list.useQuery();
  
  // Filter and transform properties for map display
  const properties = allProperties?.filter(p => 
    p.latitude && p.longitude && (p.buildingValue || p.totalValue)
  ).map(p => ({
    id: p.id,
    parcelNumber: p.parcelId,
    latitude: parseFloat(p.latitude!),
    longitude: parseFloat(p.longitude!),
    value: p.buildingValue || p.totalValue || 0,
    address: p.address,
    assessedValue: p.totalValue || 0,
  }));
  
  // Fetch neighborhood stats when property is selected
  const { data: neighborhoodStats } = trpc.parcels.getNeighborhoodStats.useQuery(
    { 
      latitude: selectedPropertyData?.latitude || 0,
      longitude: selectedPropertyData?.longitude || 0,
      radius: 1609.34 // 1 mile in meters
    },
    { enabled: !!selectedProperty && !!selectedPropertyData }
  );

  // Initialize Mapbox
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    try {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: {
          version: 8,
          sources: {
            'osm-tiles': {
              type: 'raster',
              tiles: [
                'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
                'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
                'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
              ],
              tileSize: 256,
              attribution: '© OpenStreetMap contributors'
            }
          },
          layers: [
            {
              id: 'osm-tiles-layer',
              type: 'raster',
              source: 'osm-tiles',
              minzoom: 0,
              maxzoom: 19
            }
          ],
          glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf'
        },
        center: [-119.2, 46.2], // Benton County, Washington
        zoom: 9.5,
        pitch: 0,
        bearing: 0,
      });

      map.current.on("load", () => {
        setMapLoaded(true);
      });

      // Add error handler
      map.current.on("error", (e) => {
        console.error("Mapbox error:", e);
        // Silently handle tile loading errors - they don't affect functionality
      });

      // Add navigation controls
      map.current.addControl(new maplibregl.NavigationControl(), "top-right");
      
      // Add fullscreen control
      map.current.addControl(new maplibregl.FullscreenControl(), "top-right");
    } catch (error) {
      console.error("Failed to initialize map:", error);
    }

    return () => {
      map.current?.remove();
    };
  }, []);

  // Add property markers and heatmap when data loads
  useEffect(() => {
    if (!map.current || !mapLoaded || !properties || isLoading) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Prepare GeoJSON data
    const geojsonData: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: properties.map((property: any) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [property.longitude, property.latitude],
        },
        properties: {
          id: property.id,
          value: property.value,
          parcelNumber: property.parcelNumber || "Unknown",
        },
      })),
    };

    // Add source
    if (!map.current.getSource("properties")) {
      map.current.addSource("properties", {
        type: "geojson",
        data: geojsonData,
      });
    } else {
      (map.current.getSource("properties") as maplibregl.GeoJSONSource).setData(geojsonData);
    }

    // Add heatmap layer
    if (!map.current.getLayer("properties-heatmap")) {
      map.current.addLayer({
        id: "properties-heatmap",
        type: "heatmap",
        source: "properties",
        paint: {
          // Increase weight as property value increases
          "heatmap-weight": [
            "interpolate",
            ["linear"],
            ["get", "value"],
            0, 0,
            1000000, 1,
          ],
          // Increase intensity as zoom level increases
          "heatmap-intensity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            0, 1,
            15, 3,
          ],
          // Color ramp for heatmap - TerraForge cyan theme
          "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            0, "rgba(0, 0, 0, 0)",
            0.2, "rgb(0, 50, 100)",
            0.4, "rgb(0, 100, 150)",
            0.6, "rgb(0, 150, 200)",
            0.8, "rgb(0, 200, 230)",
            1, "rgb(0, 255, 255)", // Cyan
          ],
          // Adjust radius by zoom level
          "heatmap-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            0, 2,
            15, 20,
          ],
          // Transition from heatmap to circle layer by zoom level
          "heatmap-opacity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            7, 1,
            11, 0.3,
          ],
        },
      });
    }

    // Add circle layer for individual properties (visible at higher zoom)
    if (!map.current.getLayer("properties-point")) {
      map.current.addLayer({
        id: "properties-point",
        type: "circle",
        source: "properties",
        minzoom: 10,
        paint: {
          // Size circles by property value
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["get", "value"],
            0, 6,
            500000, 10,
            1000000, 14,
          ],
          // TerraForge cyan with glow effect
          "circle-color": "#00FFFF",
          "circle-opacity": 0.9,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#FFFFFF",
          "circle-stroke-opacity": 0.6,
          // Add blur for glow effect
          "circle-blur": 0.15,
        },
      });
    }

    // Add click handler for property markers
    map.current.on("click", "properties-point", (e) => {
      if (!e.features || e.features.length === 0) return;
      
      const feature = e.features[0];
      const propertyId = feature.properties?.id;
      
      if (propertyId) {
        setSelectedProperty(propertyId);
        
        // Find full property data
        const propData = properties.find((p: any) => p.id === propertyId);
        setSelectedPropertyData(propData);
        
        // Draw 1-mile radius circle
        const coordinates = (feature.geometry as GeoJSON.Point).coordinates;
        
        // Remove existing circle if any
        if (circleLayerRef.current) {
          if (map.current!.getLayer(circleLayerRef.current)) {
            map.current!.removeLayer(circleLayerRef.current);
          }
          if (map.current!.getSource(circleLayerRef.current)) {
            map.current!.removeSource(circleLayerRef.current);
          }
        }
        
        // Add new circle
        const circleId = `circle-${propertyId}`;
        circleLayerRef.current = circleId;
        
        map.current!.addSource(circleId, {
          type: "geojson",
          data: {
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: coordinates,
            },
            properties: {},
          },
        });
        
        map.current!.addLayer({
          id: circleId,
          type: "circle",
          source: circleId,
          paint: {
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["zoom"],
              0, 0,
              20, metersToPixelsAtMaxZoom(1609.34, coordinates[1]) // 1 mile = 1609.34 meters
            ],
            "circle-color": "#00FFFF",
            "circle-opacity": 0.1,
            "circle-stroke-width": 2,
            "circle-stroke-color": "#00FFFF",
            "circle-stroke-opacity": 0.8,
          },
        });
      }
    });

    // Change cursor on hover
    map.current.on("mouseenter", "properties-point", () => {
      if (map.current) map.current.getCanvas().style.cursor = "pointer";
    });

    map.current.on("mouseleave", "properties-point", () => {
      if (map.current) map.current.getCanvas().style.cursor = "";
    });

  }, [mapLoaded, properties, isLoading]);

  // Helper function to convert meters to pixels at max zoom
  const metersToPixelsAtMaxZoom = (meters: number, latitude: number) => {
    return meters / 0.075 / Math.cos((latitude * Math.PI) / 180);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <MapPin className="w-8 h-8 text-primary" />
            Map Explorer
          </h1>
          <p className="text-muted-foreground mt-2">
            Professional GIS visualization powered by Mapbox GL JS • Benton County, Washington
          </p>
        </div>

        {/* Map Container */}
        <Card className="border-sidebar-border bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  Property Heatmap
                </CardTitle>
                <CardDescription className="mt-1">
                  {properties ? `${properties.length.toLocaleString()} properties loaded` : "Loading properties..."}
                  {" • "}Zoom in to see individual markers
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                  <Layers className="w-3 h-3 mr-1" />
                  Heatmap Active
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div
              ref={mapContainer}
              className="w-full h-[650px] rounded-lg overflow-hidden border border-sidebar-border"
              style={{ background: "#0a0e1a" }}
            />
            
            {/* Map Instructions */}
            <div className="mt-4 flex items-start gap-2 text-xs text-muted-foreground bg-sidebar/30 p-3 rounded-lg">
              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
              <div>
                <strong className="text-foreground">How to use:</strong> Zoom in to reveal individual property markers (cyan circles). 
                Click any marker to view detailed neighborhood statistics within a 1-mile radius.
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Neighborhood Stats Panel */}
        {selectedProperty && selectedPropertyData && neighborhoodStats && (
          <Card className="border-primary/30 bg-card/50 backdrop-blur-sm shadow-lg shadow-primary/5">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Neighborhood Statistics
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Analysis of properties within 1-mile radius
                  </CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setSelectedProperty(null);
                    setSelectedPropertyData(null);
                    // Remove circle
                    if (circleLayerRef.current && map.current) {
                      if (map.current.getLayer(circleLayerRef.current)) {
                        map.current.removeLayer(circleLayerRef.current);
                      }
                      if (map.current.getSource(circleLayerRef.current)) {
                        map.current.removeSource(circleLayerRef.current);
                      }
                      circleLayerRef.current = null;
                    }
                  }}
                >
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Selected Property Info */}
              <div className="p-4 rounded-lg bg-sidebar/30 border border-sidebar-border">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <HomeIcon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-muted-foreground">Selected Property</div>
                    <div className="text-lg font-semibold text-foreground truncate">
                      {selectedPropertyData.address || "Address Unknown"}
                    </div>
                    <div className="text-sm text-primary font-medium mt-1">
                      ${selectedPropertyData.assessedValue?.toLocaleString() || "N/A"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Median Home Value</div>
                  <div className="text-2xl font-bold text-primary mt-1">
                    ${neighborhoodStats.medianValue.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {selectedPropertyData.assessedValue > neighborhoodStats.medianValue ? "↑ Above" : 
                     selectedPropertyData.assessedValue < neighborhoodStats.medianValue ? "↓ Below" : "= At"} median
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-sidebar/30 border border-sidebar-border">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Avg Square Footage</div>
                  <div className="text-2xl font-bold text-foreground mt-1">
                    {neighborhoodStats.avgSquareFootage.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">sq ft</div>
                </div>
                <div className="p-4 rounded-lg bg-sidebar/30 border border-sidebar-border">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Avg Price/Sq Ft</div>
                  <div className="text-2xl font-bold text-foreground mt-1">
                    ${neighborhoodStats.avgPricePerSqFt.toFixed(2)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">per sq ft</div>
                </div>
                <div className="p-4 rounded-lg bg-sidebar/30 border border-sidebar-border">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Properties</div>
                  <div className="text-2xl font-bold text-foreground mt-1">
                    {neighborhoodStats.propertyCount}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">in radius</div>
                </div>
              </div>

              {/* Property Type Distribution */}
              {neighborhoodStats.propertyTypeDistribution && neighborhoodStats.propertyTypeDistribution.length > 0 && (
                <div>
                  <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-primary" />
                    Property Type Distribution
                  </h3>
                  <div className="space-y-3">
                    {neighborhoodStats.propertyTypeDistribution.map((item) => (
                      <div key={item.type} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{item.type}</span>
                          <span className="text-foreground font-medium">
                            {item.count} ({item.percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="h-2 bg-sidebar/30 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary/70 to-primary transition-all duration-500"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Average Age */}
              {neighborhoodStats.avgAge !== null && (
                <div>
                  <h3 className="text-base font-semibold mb-3">Average Age of Homes</h3>
                  <div className="p-4 rounded-lg bg-sidebar/30 border border-sidebar-border">
                    <div className="text-3xl font-bold text-primary">
                      {neighborhoodStats.avgAge.toFixed(1)} years
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Average construction year: {(new Date().getFullYear() - neighborhoodStats.avgAge).toFixed(0)}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Legend */}
        <Card className="border-sidebar-border bg-card/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Layers className="w-4 h-4 text-primary" />
              Map Legend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#00FFFF] border-2 border-white/60"></div>
                <div>
                  <div className="text-sm font-medium">Individual Properties</div>
                  <div className="text-xs text-muted-foreground">Visible at zoom level 10+</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-5 bg-gradient-to-r from-[#003264] via-[#0096c8] to-[#00FFFF] rounded"></div>
                <div>
                  <div className="text-sm font-medium">Density Heatmap</div>
                  <div className="text-xs text-muted-foreground">Low to high property density</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full border-2 border-[#00FFFF] bg-[#00FFFF]/10"></div>
                <div>
                  <div className="text-sm font-medium">1-Mile Radius</div>
                  <div className="text-xs text-muted-foreground">Neighborhood analysis boundary</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
