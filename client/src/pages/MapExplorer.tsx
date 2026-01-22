import { DashboardLayout } from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";

export default function MapExplorer() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<maplibregl.Marker[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

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
      center: [-119.2, 46.2], // Benton County, WA
      zoom: 10,
    });

    map.current.addControl(new maplibregl.NavigationControl(), "top-right");
    map.current.addControl(new maplibregl.FullscreenControl(), "top-right");

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Add property markers
  useEffect(() => {
    if (!map.current || !properties.length) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Filter properties with valid coordinates
    const validProperties = properties.filter(
      (p: any) => p.latitude && p.longitude
    );

    // Add markers for each property
    validProperties.forEach(property => {
      const el = document.createElement("div");
      el.className = "property-marker";
      el.dataset.propertyId = property.id.toString();
      el.style.width = "12px";
      el.style.height = "12px";
      el.style.borderRadius = "50%";
      el.style.backgroundColor = "#00FFFF";
      el.style.border = "2px solid #FFFFFF";
      el.style.cursor = "pointer";
      el.style.boxShadow = "0 0 10px rgba(0, 255, 255, 0.5)";
      el.style.transition = "all 0.3s ease";

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([parseFloat(property.longitude!), parseFloat(property.latitude!)])
        .addTo(map.current!);

      // Use marker element's onclick for immediate event binding
      const markerEl = marker.getElement();
      markerEl.onclick = (e) => {
        e.stopPropagation();
        console.log("✅ Marker clicked! Property:", property.id, property.address);
        setSelectedProperty(property.id);
        // Scroll to stats panel
        setTimeout(() => {
          const statsPanel = document.querySelector(".neighborhood-stats-panel");
          console.log("📊 Stats panel:", statsPanel);
          if (statsPanel) {
            statsPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
          }
        }, 200);
      };

      markers.current.push(marker);
    });
  }, [allProperties]);

  // Highlight selected marker
  useEffect(() => {
    // Reset all markers to default style
    const allMarkerElements = document.querySelectorAll(".property-marker");
    allMarkerElements.forEach((el: any) => {
      el.style.width = "12px";
      el.style.height = "12px";
      el.style.backgroundColor = "#00FFFF";
      el.style.border = "2px solid #FFFFFF";
      el.style.boxShadow = "0 0 10px rgba(0, 255, 255, 0.5)";
      el.style.zIndex = "0";
    });

    // Highlight selected marker
    if (selectedProperty) {
      const selectedMarkerEl = document.querySelector(`[data-property-id="${selectedProperty}"]`);
      if (selectedMarkerEl) {
        (selectedMarkerEl as HTMLElement).style.width = "20px";
        (selectedMarkerEl as HTMLElement).style.height = "20px";
        (selectedMarkerEl as HTMLElement).style.backgroundColor = "#00FFFF";
        (selectedMarkerEl as HTMLElement).style.border = "3px solid #FFFFFF";
        (selectedMarkerEl as HTMLElement).style.boxShadow = "0 0 20px rgba(0, 255, 255, 1), 0 0 40px rgba(0, 255, 255, 0.5)";
        (selectedMarkerEl as HTMLElement).style.zIndex = "1000";
      }
    }
  }, [selectedProperty]);

  // Get selected property details
  const selectedPropertyData = properties.find((p: any) => p.id === selectedProperty);

  // Fetch neighborhood stats when property is selected
  const { data: neighborhoodStats } = trpc.parcels.getNeighborhoodStats.useQuery(
    {
      latitude: parseFloat(selectedPropertyData?.latitude || "0"),
      longitude: parseFloat(selectedPropertyData?.longitude || "0"),
    },
    { enabled: !!selectedProperty && !!selectedPropertyData?.latitude && !!selectedPropertyData?.longitude }
  );

  // Get count of properties with valid coordinates
  const validPropertiesCount = properties.filter((p: any) => p.latitude && p.longitude).length;
  const filteredValidCount = filteredProperties.filter((p: any) => p.latitude && p.longitude).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
              <span className="text-primary">◉</span> Map Explorer
            </h1>
            <p className="text-muted-foreground mt-2">
              Professional GIS visualization powered by MapLibre GL JS • Benton County, Washington
            </p>
          </div>
          <Button variant="outline" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? "Hide" : "Show"} Properties
          </Button>
        </div>

        {/* Map Container */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Property Map</CardTitle>
                <CardDescription>
                  {isLoading
                    ? "Loading properties..."
                    : `${validPropertiesCount} properties loaded • Click markers to view details`}
                </CardDescription>
              </div>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                MapLibre Active
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              {/* Property List Sidebar */}
              {sidebarOpen && (
                <div className="w-80 flex-shrink-0 border-r border-border pr-4">
                  {/* Search Bar */}
                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Search by address or parcel..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 pr-9 focus:border-primary transition-colors"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery("")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    {searchQuery && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Found {filteredValidCount} {filteredValidCount === 1 ? 'property' : 'properties'} matching "{searchQuery}"
                      </p>
                    )}
                  </div>

                  {/* Property List */}
                  <div className="space-y-2 max-h-[520px] overflow-y-auto">
                    <h3 className="text-sm font-semibold text-foreground mb-3">
                      Properties ({filteredValidCount})
                    </h3>
                    {filteredValidCount === 0 && searchQuery ? (
                      <div className="text-center py-8">
                        <Search className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">No properties found</p>
                        <p className="text-xs text-muted-foreground mt-1">Try a different search term</p>
                      </div>
                    ) : (
                      filteredProperties.filter((p: any) => p.latitude && p.longitude).map((property: any) => (
                        <button
                          key={property.id}
                          onClick={() => {
                            console.log("✅ Property selected from sidebar:", property.id);
                            setSelectedProperty(property.id);
                            // Pan map to property
                            if (map.current && property.latitude && property.longitude) {
                              map.current.flyTo({
                                center: [parseFloat(property.longitude), parseFloat(property.latitude)],
                                zoom: 14,
                                duration: 1000
                              });
                            }
                          }}
                          className={`w-full text-left p-3 rounded-lg border transition-all hover:border-primary/50 ${
                            selectedProperty === property.id
                              ? "border-primary bg-primary/10"
                              : "border-border bg-card"
                          }`}
                        >
                          <div className="text-sm font-medium text-foreground truncate">
                            {property.address || "Unknown Address"}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Parcel: {property.parcelNumber || "N/A"}
                          </div>
                          <div className="text-xs text-primary mt-1 font-mono">
                            ${property.assessedValue?.toLocaleString() || "N/A"}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Map */}
              <div className="flex-1">
                <div
                  ref={mapContainer}
                  className="w-full h-[600px] rounded-lg overflow-hidden border border-border"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              ✨ Select a property from the list to view details and neighborhood statistics
            </p>
          </CardContent>
        </Card>

        {/* Neighborhood Statistics Panel */}
        {selectedProperty && neighborhoodStats && (
          <Card className="border-primary/20 neighborhood-stats-panel">
            <CardHeader>
              <CardTitle className="text-primary">Neighborhood Statistics</CardTitle>
              <CardDescription>
                Within 1-mile radius • {neighborhoodStats.propertyCount} properties analyzed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="text-sm text-muted-foreground">Median Home Value</div>
                  <div className="text-2xl font-bold text-foreground">
                    ${neighborhoodStats.medianValue?.toLocaleString() || "N/A"}
                  </div>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="text-sm text-muted-foreground">Avg Square Footage</div>
                  <div className="text-2xl font-bold text-foreground">
                    {neighborhoodStats.avgSquareFootage?.toLocaleString() || "N/A"} sqft
                  </div>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="text-sm text-muted-foreground">Avg Price/sqft</div>
                  <div className="text-2xl font-bold text-foreground">
                    ${neighborhoodStats.avgPricePerSqFt?.toFixed(2) || "N/A"}
                  </div>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="text-sm text-muted-foreground">Property Count</div>
                  <div className="text-2xl font-bold text-foreground">
                    {neighborhoodStats.propertyCount}
                  </div>
                </div>
              </div>

              {neighborhoodStats.propertyTypeDistribution && neighborhoodStats.propertyTypeDistribution.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-foreground mb-3">Property Type Distribution</h3>
                  <div className="space-y-2">
                    {neighborhoodStats.propertyTypeDistribution.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="w-32 text-sm text-muted-foreground">{item.type}</div>
                        <div className="flex-1 h-8 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary/60 to-primary flex items-center justify-end pr-3"
                            style={{ width: `${item.percentage}%` }}
                          >
                            <span className="text-xs font-medium text-primary-foreground">
                              {item.percentage.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <div className="w-16 text-sm text-muted-foreground text-right">{item.count}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {neighborhoodStats.avgAge !== null && (
                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <div className="text-sm text-muted-foreground">Average Age of Homes</div>
                  <div className="text-xl font-bold text-foreground">
                    {neighborhoodStats.avgAge} years old
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
