import { DashboardLayout } from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, X, Flame } from "lucide-react";

export default function MapExplorer() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [heatmapVisible, setHeatmapVisible] = useState(false);

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

  // Add property markers with clustering
  useEffect(() => {
    if (!map.current || !properties.length) return;

    const mapInstance = map.current;

    // Wait for map to load before adding sources/layers
    const addClustering = () => {
      // Remove existing source and layers if they exist
      if (mapInstance.getSource('properties')) {
        if (mapInstance.getLayer('clusters')) mapInstance.removeLayer('clusters');
        if (mapInstance.getLayer('cluster-count')) mapInstance.removeLayer('cluster-count');
        if (mapInstance.getLayer('unclustered-point')) mapInstance.removeLayer('unclustered-point');
        mapInstance.removeSource('properties');
      }

      // Filter properties with valid coordinates
      const validProperties = properties.filter(
        (p: any) => p.latitude && p.longitude
      );

      // Create GeoJSON FeatureCollection
      const geojson: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: validProperties.map((property: any) => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [parseFloat(property.longitude), parseFloat(property.latitude)]
          },
          properties: {
            id: property.id,
            address: property.address || 'Unknown Address',
            parcelNumber: property.parcelNumber || 'N/A',
            assessedValue: property.assessedValue || 0
          }
        }))
      };

      // Add clustered GeoJSON source
      mapInstance.addSource('properties', {
        type: 'geojson',
        data: geojson,
        cluster: true,
        clusterMaxZoom: 14, // Max zoom to cluster points on
        clusterRadius: 50 // Radius of each cluster when clustering points
      });

      // Add cluster circle layer
      mapInstance.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'properties',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count'],
            '#00FFFF',  // Cyan for small clusters (< 10)
            10,
            '#00D9D9',  // Darker cyan for medium clusters (10-30)
            30,
            '#00B8B8'   // Even darker for large clusters (30+)
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            20,  // 20px for small clusters
            10,
            30,  // 30px for medium clusters
            30,
            40   // 40px for large clusters
          ],
          'circle-opacity': 0.8,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#FFFFFF'
        }
      });

      // Add cluster count labels
      mapInstance.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'properties',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
          'text-size': 14
        },
        paint: {
          'text-color': '#FFFFFF'
        }
      });

      // Add unclustered point layer (individual properties)
      mapInstance.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'properties',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': '#00FFFF',
          'circle-radius': 8,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#FFFFFF',
          'circle-opacity': 0.9
        }
      });

      // Add separate heatmap source (non-clustered)
      if (mapInstance.getSource('heatmap-data')) {
        mapInstance.removeSource('heatmap-data');
      }
      mapInstance.addSource('heatmap-data', {
        type: 'geojson',
        data: geojson
      });

      // Add heatmap layer (initially hidden)
      if (mapInstance.getLayer('property-heatmap')) {
        mapInstance.removeLayer('property-heatmap');
      }
      mapInstance.addLayer({
        id: 'property-heatmap',
        type: 'heatmap',
        source: 'heatmap-data',
        maxzoom: 15,
        paint: {
          // Increase weight based on assessed value
          'heatmap-weight': [
            'interpolate',
            ['linear'],
            ['get', 'assessedValue'],
            0, 0,
            100000, 0.2,
            500000, 0.5,
            1000000, 1
          ],
          // Increase intensity as zoom level increases
          'heatmap-intensity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 0.5,
            15, 1.5
          ],
          // Color gradient: blue (low) → yellow → red (high)
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(33, 102, 172, 0)',
            0.2, 'rgb(103, 169, 207)',
            0.4, 'rgb(209, 229, 240)',
            0.6, 'rgb(253, 219, 199)',
            0.8, 'rgb(239, 138, 98)',
            1, 'rgb(178, 24, 43)'
          ],
          // Adjust radius based on zoom level
          'heatmap-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 2,
            15, 30
          ],
          // Transition from heatmap to circle layer at higher zoom
          'heatmap-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            7, 0.8,
            15, 0.3
          ]
        },
        layout: {
          'visibility': 'none' // Initially hidden
        }
      });

      // Click handler for clusters - zoom in
      mapInstance.on('click', 'clusters', (e) => {
        const features = mapInstance.queryRenderedFeatures(e.point, {
          layers: ['clusters']
        });

        if (!features.length) return;

        const clusterId = features[0].properties?.cluster_id;
        const source = mapInstance.getSource('properties') as maplibregl.GeoJSONSource;
        const coordinates = (features[0].geometry as GeoJSON.Point).coordinates;

        // Zoom into the cluster
        source.getClusterExpansionZoom(clusterId).then((zoom: number) => {
          mapInstance.easeTo({
            center: [coordinates[0], coordinates[1]],
            zoom: zoom || 14
          });
        }).catch(() => {
          // Fallback zoom if expansion zoom fails
          mapInstance.easeTo({
            center: [coordinates[0], coordinates[1]],
            zoom: 14
          });
        });
      });

      // Click handler for individual points - select property
      mapInstance.on('click', 'unclustered-point', (e) => {
        const features = mapInstance.queryRenderedFeatures(e.point, {
          layers: ['unclustered-point']
        });

        if (!features.length) return;

        const propertyId = features[0].properties?.id;
        console.log("✅ Unclustered point clicked! Property ID:", propertyId);
        setSelectedProperty(propertyId);

        // Scroll to stats panel
        setTimeout(() => {
          const statsPanel = document.querySelector(".neighborhood-stats-panel");
          if (statsPanel) {
            statsPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
          }
        }, 200);
      });

      // Change cursor on hover
      const clusterMouseEnter = () => {
        mapInstance.getCanvas().style.cursor = 'pointer';
      };
      const clusterMouseLeave = () => {
        mapInstance.getCanvas().style.cursor = '';
      };
      const pointMouseEnter = () => {
        mapInstance.getCanvas().style.cursor = 'pointer';
      };
      const pointMouseLeave = () => {
        mapInstance.getCanvas().style.cursor = '';
      };

      mapInstance.on('mouseenter', 'clusters', clusterMouseEnter as any);
      mapInstance.on('mouseleave', 'clusters', clusterMouseLeave as any);
      mapInstance.on('mouseenter', 'unclustered-point', pointMouseEnter as any);
      mapInstance.on('mouseleave', 'unclustered-point', pointMouseLeave as any);
    };

    if (mapInstance.loaded()) {
      addClustering();
    } else {
      mapInstance.on('load', addClustering);
    }

    // Cleanup - event handlers are automatically removed when layers are removed
  }, [properties]);

  // Toggle heatmap visibility
  useEffect(() => {
    if (!map.current) return;

    const mapInstance = map.current;

    if (mapInstance.getLayer('property-heatmap')) {
      mapInstance.setLayoutProperty(
        'property-heatmap',
        'visibility',
        heatmapVisible ? 'visible' : 'none'
      );
    }
  }, [heatmapVisible]);

  // Highlight selected property by updating layer paint
  useEffect(() => {
    if (!map.current || !selectedProperty) return;

    const mapInstance = map.current;

    // Update unclustered-point layer to highlight selected property
    if (mapInstance.getLayer('unclustered-point')) {
      mapInstance.setPaintProperty('unclustered-point', 'circle-radius', [
        'case',
        ['==', ['get', 'id'], selectedProperty],
        14,  // Larger radius for selected
        8    // Normal radius
      ]);

      mapInstance.setPaintProperty('unclustered-point', 'circle-stroke-width', [
        'case',
        ['==', ['get', 'id'], selectedProperty],
        3,   // Thicker stroke for selected
        2    // Normal stroke
      ]);
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
          <div className="flex gap-2">
            <Button
              variant={heatmapVisible ? "default" : "outline"}
              onClick={() => setHeatmapVisible(!heatmapVisible)}
              className="gap-2"
            >
              <Flame className="h-4 w-4" />
              {heatmapVisible ? "Hide" : "Show"} Heatmap
            </Button>
            <Button variant="outline" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? "Hide" : "Show"} Properties
            </Button>
          </div>
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
                    : `${validPropertiesCount} properties loaded • Clustering enabled for better performance`}
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
              ✨ Click clusters to zoom in • Click individual markers to view property details
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
