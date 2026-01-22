import { DashboardLayout } from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function MapExplorer() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<maplibregl.Marker[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<number | null>(null);

  // Fetch property data
  const { data: allProperties, isLoading } = trpc.parcels.list.useQuery();

  const properties = allProperties || [];

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
      el.style.width = "12px";
      el.style.height = "12px";
      el.style.borderRadius = "50%";
      el.style.backgroundColor = "#00FFFF";
      el.style.border = "2px solid #FFFFFF";
      el.style.cursor = "pointer";
      el.style.boxShadow = "0 0 10px rgba(0, 255, 255, 0.5)";

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([parseFloat(property.longitude!), parseFloat(property.latitude!)])
        .setPopup(
          new maplibregl.Popup({ offset: 15 }).setHTML(
            `<div style="padding: 8px;">
              <strong>${property.address || "Unknown Address"}</strong><br/>
              <small>Parcel: ${property.parcelId}</small><br/>
              <small>Value: $${property.totalValue?.toLocaleString() || "N/A"}</small>
            </div>`
          )
        )
        .addTo(map.current!);

      // Add click handler
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        console.log("Marker clicked, property ID:", property.id);
        setSelectedProperty(property.id);
        // Scroll to stats panel after a short delay
        setTimeout(() => {
          document.querySelector(".neighborhood-stats-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      });

      markers.current.push(marker);
    });
  }, [allProperties]);

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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <span className="text-primary">◉</span> Map Explorer
          </h1>
          <p className="text-muted-foreground mt-2">
            Professional GIS visualization powered by MapLibre GL JS • Benton County, Washington
          </p>
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
                    : `${properties.filter((p: any) => p.latitude && p.longitude).length || 0} properties loaded • Click markers to view details`}
                </CardDescription>
              </div>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                MapLibre Active
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div
              ref={mapContainer}
              className="w-full h-[600px] rounded-lg overflow-hidden border border-border"
            />
            <p className="text-xs text-muted-foreground mt-2">
              💡 How to use: Click any cyan marker to view property details and neighborhood statistics
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
