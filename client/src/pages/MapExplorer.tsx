import { DashboardLayout } from "@/components/DashboardLayout";
import { GISTools } from "@/components/GISTools";
import { LayerManager, defaultLayers, type Layer } from "@/components/LayerManager";
import { MapLegend } from "@/components/MapLegend";
import { MeasurementTools } from "@/components/MeasurementTools";
import { trpc } from "@/lib/trpc";
import { useEffect, useRef, useState } from "react";
import { useWAParcels } from "@/contexts/WAParcelContext";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, X, Flame, ChevronLeft, ChevronRight, Settings, Target, Download, FileText } from "lucide-react";
import { ValueTrendChart } from "@/components/ValueTrendChart";
import { exportSpatialQueryToCSV } from "@/lib/csvExport";
import { TactileButton } from "@/components/TactileButton";
import { LiquidPanel } from "@/components/LiquidPanel";
import { KineticText } from "@/components/KineticText";
import { SearchAutocomplete, type SearchSuggestion } from "@/components/ui/SearchAutocomplete";
import { ClusterTooltip } from "@/components/ClusterTooltip";

// Property Image Preview Component
function PropertyImagePreview({ 
  propertyId, 
  latitude, 
  longitude, 
  mapType, 
  onToggle 
}: { 
  propertyId: number;
  latitude: number;
  longitude: number;
  mapType: 'roadmap' | 'satellite';
  onToggle: (type: 'roadmap' | 'satellite') => void;
}) {
  const { data, isLoading } = trpc.parcels.getStaticMapUrl.useQuery({
    latitude,
    longitude,
    mapType,
    zoom: mapType === 'satellite' ? 19 : 18,
    width: 400,
    height: 200,
  });

  if (isLoading) {
    return (
      <div className="relative rounded-lg overflow-hidden bg-muted/50 h-32 flex items-center justify-center">
        <div className="text-xs text-muted-foreground">Loading map...</div>
      </div>
    );
  }

  return (
    <div className="relative rounded-lg overflow-hidden bg-muted/50 h-32">
      {data?.url && (
        <img
          src={data.url}
          alt="Property view"
          className="w-full h-full object-cover"
        />
      )}
      <div className="absolute bottom-2 right-2 flex gap-1">
        <Button
          size="sm"
          variant={mapType === 'roadmap' ? 'default' : 'outline'}
          className="h-6 px-2 text-xs"
          onClick={() => onToggle('roadmap')}
        >
          Street
        </Button>
        <Button
          size="sm"
          variant={mapType === 'satellite' ? 'default' : 'outline'}
          className="h-6 px-2 text-xs"
          onClick={() => onToggle('satellite')}
        >
          Satellite
        </Button>
      </div>
    </div>
  );
}

// Property History Chart Component
function PropertyHistoryChart({ propertyId }: { propertyId: number }) {
  const { data: history, isLoading } = trpc.parcels.getHistory.useQuery({ parcelId: propertyId });
  
  if (isLoading) {
    return <div className="h-[60px] flex items-center justify-center text-xs text-muted-foreground">Loading...</div>;
  }
  
  if (!history || history.length === 0) {
    return <div className="h-[60px] flex items-center justify-center text-xs text-muted-foreground">No data</div>;
  }
  
  const chartData = history.map(h => ({
    year: h.assessmentYear,
    value: h.totalValue || 0
  }));
  
  return <ValueTrendChart data={chartData} height={60} />;
}

export default function MapExplorer() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const { loadedParcels, clearLoadedParcels } = useWAParcels();
  const [selectedProperty, setSelectedProperty] = useState<number | null>(null);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [selectedProperties, setSelectedProperties] = useState<number[]>([]);
  const [propertyImageViews, setPropertyImageViews] = useState<Record<number, 'roadmap' | 'satellite'>>({});
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [gisToolsOpen, setGisToolsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [autocompleteOpen, setAutocompleteOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<number[]>([]);
  const [heatmapVisible, setHeatmapVisible] = useState(false);
  const [layers, setLayers] = useState<Layer[]>(defaultLayers);
  const [bufferZoneVisible, setBufferZoneVisible] = useState(false);
  const [spatialQueryMode, setSpatialQueryMode] = useState(false);
  const [queryResults, setQueryResults] = useState<any>(null);
  const [measurementMode, setMeasurementMode] = useState<"distance" | "area" | null>(null);
  const [fabMenuOpen, setFabMenuOpen] = useState(false);
  const [clusterTooltip, setClusterTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    propertyIds: number[];
  } | null>(null);

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

  // Generate search suggestions based on query
  const getSearchSuggestions = (): SearchSuggestion[] => {
    if (!searchQuery.trim()) {
      // Show recent searches when no query
      return recentSearches
        .map(id => properties.find((p: any) => p.id === id))
        .filter(Boolean)
        .map((p: any) => ({
          id: p.id.toString(),
          address: p.address || 'Unknown Address',
          parcelNumber: p.parcelNumber || 'N/A',
          assessedValue: p.assessedValue || 0,
          type: 'recent' as const,
        }));
    }

    // Filter and return matching properties (limit to 8)
    return filteredProperties.slice(0, 8).map((p: any) => ({
      id: p.id.toString(),
      address: p.address || 'Unknown Address',
      parcelNumber: p.parcelNumber || 'N/A',
      assessedValue: p.assessedValue || 0,
      type: 'property' as const,
    }));
  };

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

  // GIS buffer zone query
  const bufferZoneQuery = trpc.gis.generateBufferZone.useQuery(
    {
      latitude: parseFloat(selectedPropertyData?.latitude || "0"),
      longitude: parseFloat(selectedPropertyData?.longitude || "0"),
      radiusMiles: 1.0,
      points: 32,
    },
    {
      enabled: !!selectedPropertyData?.latitude && !!selectedPropertyData?.longitude && bufferZoneVisible,
    }
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
        if (mapInstance.getLayer('selected-property')) mapInstance.removeLayer('selected-property');
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

      // Add clustered GeoJSON source with value-based properties
      mapInstance.addSource('properties', {
        type: 'geojson',
        data: geojson,
        cluster: true,
        clusterMaxZoom: 14, // Max zoom to cluster points on
        clusterRadius: 50, // Radius of each cluster when clustering points
        clusterProperties: {
          // Calculate average assessed value for each cluster
          avgValue: ['+', ['get', 'assessedValue']],
          count: ['+', 1]
        }
      });

      // Add cluster circle layer with value-based color coding
      mapInstance.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'properties',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['/', ['get', 'avgValue'], ['get', 'count']], // Calculate average value
            '#22c55e',  // Green for low value (<$200k)
            200000,
            '#eab308',  // Yellow for medium value ($200k-$400k)
            400000,
            '#ef4444'   // Red for high value (>$400k)
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
          'circle-opacity': 0.85,
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

      // Add unclustered point layer (individual properties) with value-based colors
      mapInstance.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'properties',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': [
            'step',
            ['get', 'assessedValue'],
            '#22c55e',  // Green for low value (<$200k)
            200000,
            '#eab308',  // Yellow for medium value ($200k-$400k)
            400000,
            '#ef4444'   // Red for high value (>$400k)
          ],
          'circle-radius': 8,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#FFFFFF',
          'circle-opacity': 0.9
        }
      });

      // Add heatmap layer (initially hidden)
      // IMPORTANT: Remove layer before removing source
      if (mapInstance.getLayer('property-heatmap')) {
        mapInstance.removeLayer('property-heatmap');
      }
      
      // Add separate heatmap source (non-clustered)
      if (mapInstance.getSource('heatmap-data')) {
        mapInstance.removeSource('heatmap-data');
      }
      mapInstance.addSource('heatmap-data', {
        type: 'geojson',
        data: geojson
      });
      
      // Only add layer if it doesn't already exist
      if (!mapInstance.getLayer('property-heatmap')) {
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
      }

      // Click handler for clusters - show tooltip
      mapInstance.on('click', 'clusters', (e) => {
        const features = mapInstance.queryRenderedFeatures(e.point, {
          layers: ['clusters']
        });

        if (!features.length) return;

        const clusterId = features[0].properties?.cluster_id;
        const source = mapInstance.getSource('properties') as maplibregl.GeoJSONSource;

        // Get property IDs in the cluster
        source.getClusterLeaves(clusterId, 1000, 0).then((leaves: any[]) => {
          const propertyIds = leaves.map(leaf => leaf.properties.id);
          
          // Show tooltip at click position
          setClusterTooltip({
            visible: true,
            x: e.point.x,
            y: e.point.y,
            propertyIds,
          });
        }).catch((err) => {
          console.error('Failed to get cluster leaves:', err);
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
        
        // Handle comparison mode vs single selection
        if (comparisonMode) {
          setSelectedProperties(prev => {
            if (prev.includes(propertyId)) {
              // Remove if already selected
              return prev.filter(id => id !== propertyId);
            } else if (prev.length < 4) {
              // Add if less than 4 properties selected
              return [...prev, propertyId];
            }
            return prev; // Max 4 properties
          });
        } else {
          setSelectedProperty(propertyId);
        }

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

      mapInstance.on('mouseenter', 'clusters', clusterMouseEnter);
      mapInstance.on('mouseleave', 'clusters', clusterMouseLeave);
      mapInstance.on('mouseenter', 'unclustered-point', pointMouseEnter);
      mapInstance.on('mouseleave', 'unclustered-point', pointMouseLeave);

      // Add spatial query click handler
      mapInstance.on('click', (e) => {
        if (!spatialQueryMode) return;

        // Query all visible layers at clicked point
        const point = e.point;
        const layerIds = layers
          .filter(l => l.visible && l.id !== 'properties')
          .map(l => l.id);

        const features = mapInstance.queryRenderedFeatures(point, {
          layers: layerIds
        });

        // Organize results by layer
        const results: any = {
          point: { lat: e.lngLat.lat, lng: e.lngLat.lng },
          layers: {}
        };

        features.forEach(feature => {
          const layerId = feature.layer.id;
          if (!results.layers[layerId]) {
            results.layers[layerId] = [];
          }
          results.layers[layerId].push(feature.properties);
        });

        setQueryResults(results);
        console.log('✅ Spatial query results:', results);
      });
    };

    if (mapInstance.isStyleLoaded()) {
      addClustering();
    } else {
      mapInstance.on('load', addClustering);
    }
  }, [properties]);

  // Handle WA County Parcel Loading
  useEffect(() => {
    if (!map.current || !loadedParcels) return;

    const mapInstance = map.current;
    const sourceId = 'wa-parcels';
    const layerId = 'wa-parcels-layer';

    // Remove existing WA parcel layer if it exists
    if (mapInstance.getLayer(layerId)) {
      mapInstance.removeLayer(layerId);
    }
    if (mapInstance.getSource(sourceId)) {
      mapInstance.removeSource(sourceId);
    }

    // Add WA parcel source
    mapInstance.addSource(sourceId, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: loadedParcels.features,
      },
    });

    // Add WA parcel layer
    mapInstance.addLayer({
      id: layerId,
      type: 'fill',
      source: sourceId,
      paint: {
        'fill-color': '#00FFEE',
        'fill-opacity': 0.2,
        'fill-outline-color': '#00FFEE',
      },
    });

    // Fly to county bounds
    const { bounds } = loadedParcels;
    mapInstance.fitBounds(
      [
        [bounds.minLng, bounds.minLat],
        [bounds.maxLng, bounds.maxLat],
      ],
      {
        padding: 50,
        duration: 2000,
      }
    );

    return () => {
      if (mapInstance.getLayer(layerId)) {
        mapInstance.removeLayer(layerId);
      }
      if (mapInstance.getSource(sourceId)) {
        mapInstance.removeSource(sourceId);
      }
    };
  }, [loadedParcels]);

  // Handle property selection - fly to location and highlight
  useEffect(() => {
    if (!map.current || !selectedProperty || !selectedPropertyData) return;

    const mapInstance = map.current;
    const lat = parseFloat(selectedPropertyData.latitude || "0");
    const lon = parseFloat(selectedPropertyData.longitude || "0");

    // Fly to selected property
    mapInstance.flyTo({
      center: [lon, lat],
      zoom: 15,
      essential: true,
    });

    // Add or update selected property highlight layer
    if (mapInstance.getLayer('selected-property')) {
      mapInstance.removeLayer('selected-property');
    }
    if (mapInstance.getSource('selected-property-source')) {
      mapInstance.removeSource('selected-property-source');
    }

    mapInstance.addSource('selected-property-source', {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [lon, lat]
        },
        properties: {}
      }
    });

    mapInstance.addLayer({
      id: 'selected-property',
      type: 'circle',
      source: 'selected-property-source',
      paint: {
        'circle-radius': 14,
        'circle-color': '#00FFFF',
        'circle-stroke-width': 3,
        'circle-stroke-color': '#FFFFFF',
        'circle-opacity': 1
      }
    });
  }, [selectedProperty, selectedPropertyData]);

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

  // Add buffer zone visualization
  useEffect(() => {
    if (!map.current || !bufferZoneQuery.data || !bufferZoneVisible) {
      // Remove buffer zone if it exists
      if (map.current) {
        if (map.current.getLayer('buffer-zone')) {
          map.current.removeLayer('buffer-zone');
        }
        if (map.current.getSource('buffer-zone-source')) {
          map.current.removeSource('buffer-zone-source');
        }
      }
      return;
    }

    const mapInstance = map.current;

    // Remove existing buffer zone
    if (mapInstance.getLayer('buffer-zone')) {
      mapInstance.removeLayer('buffer-zone');
    }
    if (mapInstance.getSource('buffer-zone-source')) {
      mapInstance.removeSource('buffer-zone-source');
    }

    // Add buffer zone source and layer
    mapInstance.addSource('buffer-zone-source', {
      type: 'geojson',
      data: bufferZoneQuery.data as GeoJSON.Feature
    });

    mapInstance.addLayer({
      id: 'buffer-zone',
      type: 'fill',
      source: 'buffer-zone-source',
      paint: {
        'fill-color': '#00FFFF',
        'fill-opacity': 0.15,
        'fill-outline-color': '#00FFFF'
      }
    });

    // Add buffer zone outline
    mapInstance.addLayer({
      id: 'buffer-zone-outline',
      type: 'line',
      source: 'buffer-zone-source',
      paint: {
        'line-color': '#00FFFF',
        'line-width': 2,
        'line-dasharray': [2, 2]
      }
    });
  }, [bufferZoneQuery.data, bufferZoneVisible]);

  // Render GIS layers based on visibility toggles
  useEffect(() => {
    if (!map.current) return;
    const mapInstance = map.current;

    // Wait for map to be loaded
    if (!mapInstance.isStyleLoaded()) {
      mapInstance.on('load', () => {
        renderLayers();
      });
      return;
    }

    renderLayers();

    function renderLayers() {
      if (!mapInstance) return;

      layers.forEach((layer) => {
        const sourceId = `layer-${layer.id}`;
        const layerId = `layer-render-${layer.id}`;

        if (layer.visible) {
          // Fetch layer data and add to map
          fetchLayerData(layer.id).then((geojson) => {
            // Remove existing layer/source if present
            if (mapInstance.getLayer(layerId)) {
              mapInstance.removeLayer(layerId);
            }
            if (mapInstance.getSource(sourceId)) {
              mapInstance.removeSource(sourceId);
            }

            // Add source
            mapInstance.addSource(sourceId, {
              type: 'geojson',
              data: geojson
            });

            // Add layer based on geometry type
            const firstFeature = geojson.features[0];
            if (!firstFeature) return;

            const geometryType = firstFeature.geometry.type;

            if (geometryType === 'Polygon' || geometryType === 'MultiPolygon') {
              // Polygon layers (zoning, school districts, flood zones, parks)
              mapInstance.addLayer({
                id: layerId,
                type: 'fill',
                source: sourceId,
                paint: {
                  'fill-color': getLayerColor(layer.id),
                  'fill-opacity': layer.opacity / 100,
                  'fill-outline-color': getLayerOutlineColor(layer.id)
                }
              });

              // Add outline layer
              mapInstance.addLayer({
                id: `${layerId}-outline`,
                type: 'line',
                source: sourceId,
                paint: {
                  'line-color': getLayerOutlineColor(layer.id),
                  'line-width': 2,
                  'line-opacity': layer.opacity / 100
                }
              });
            } else if (geometryType === 'LineString' || geometryType === 'MultiLineString') {
              // Line layers (transit routes, utility lines)
              mapInstance.addLayer({
                id: layerId,
                type: 'line',
                source: sourceId,
                paint: {
                  'line-color': getLayerColor(layer.id),
                  'line-width': 3,
                  'line-opacity': layer.opacity / 100
                }
              });
            }

            // Add click handler for popups
            mapInstance.on('click', layerId, (e) => {
              if (!e.features || e.features.length === 0) return;
              
              const feature = e.features[0];
              const properties = feature.properties || {};
              
              // Format popup content based on layer type
              const popupContent = formatPopupContent(layer.id, properties);
              
              new maplibregl.Popup()
                .setLngLat(e.lngLat)
                .setHTML(popupContent)
                .addTo(mapInstance);
            });

            // Change cursor on hover
            mapInstance.on('mouseenter', layerId, () => {
              mapInstance.getCanvas().style.cursor = 'pointer';
            });
            mapInstance.on('mouseleave', layerId, () => {
              mapInstance.getCanvas().style.cursor = '';
            });
          });
        } else {
          // Remove layer if not visible
          if (mapInstance.getLayer(layerId)) {
            mapInstance.removeLayer(layerId);
          }
          if (mapInstance.getLayer(`${layerId}-outline`)) {
            mapInstance.removeLayer(`${layerId}-outline`);
          }
          if (mapInstance.getSource(sourceId)) {
            mapInstance.removeSource(sourceId);
          }
        }
      });
    }

    async function fetchLayerData(layerId: string): Promise<GeoJSON.FeatureCollection> {
      // Map layer IDs to API endpoints
      const endpointMap: Record<string, string> = {
        'zoning': '/api/trpc/layerData.getZoningDistricts',
        'schools': '/api/trpc/layerData.getSchoolDistricts',
        'floods': '/api/trpc/layerData.getFloodZones',
        'transit': '/api/trpc/layerData.getTransitRoutes',
        'parks': '/api/trpc/layerData.getParksRecreation',
        'utilities': '/api/trpc/layerData.getUtilityLines',
      };

      const endpoint = endpointMap[layerId];
      if (!endpoint) {
        return { type: 'FeatureCollection', features: [] };
      }

      try {
        const response = await fetch(endpoint, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        return result.result.data;
      } catch (error) {
        console.error(`Error fetching layer data for ${layerId}:`, error);
        return { type: 'FeatureCollection', features: [] };
      }
    }

    function getLayerColor(layerId: string): string {
      const colors: Record<string, string> = {
        'zoning': '#FFD700',      // Gold for zoning
        'schools': '#4169E1',     // Royal blue for schools
        'floods': '#1E90FF',      // Dodger blue for flood zones
        'transit': '#FF6347',     // Tomato red for transit
        'parks': '#32CD32',       // Lime green for parks
        'utilities': '#FF8C00',   // Dark orange for utilities
        'properties': '#00FFFF'   // Cyan for properties (already handled)
      };
      return colors[layerId] || '#808080';
    }

    function getLayerOutlineColor(layerId: string): string {
      const colors: Record<string, string> = {
        'zoning': '#DAA520',      // Goldenrod outline
        'schools': '#000080',     // Navy outline
        'floods': '#00008B',      // Dark blue outline
        'transit': '#8B0000',     // Dark red outline
        'parks': '#006400',       // Dark green outline
        'utilities': '#FF4500',   // Orange red outline
      };
      return colors[layerId] || '#000000';
    }

    function formatPopupContent(layerId: string, properties: any): string {
      const baseStyle = `
        <div style="
          font-family: 'Inter', sans-serif;
          color: #0A0E1A;
          padding: 8px;
          min-width: 200px;
        ">
      `;
      
      let content = '';
      
      switch (layerId) {
        case 'zoning':
          content = `
            <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #FFD700;">
              🏘️ Zoning District
            </h3>
            <div style="font-size: 14px; line-height: 1.6;">
              <strong>Zone:</strong> ${properties.zone || 'N/A'}<br/>
              <strong>Type:</strong> ${properties.zoneType || 'N/A'}<br/>
              <strong>Description:</strong> ${properties.description || 'N/A'}
            </div>
          `;
          break;
        
        case 'schools':
          content = `
            <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #4169E1;">
              🏫 School District
            </h3>
            <div style="font-size: 14px; line-height: 1.6;">
              <strong>District:</strong> ${properties.name || 'N/A'}<br/>
              <strong>Type:</strong> ${properties.type || 'N/A'}<br/>
              <strong>Grades:</strong> ${properties.grades || 'N/A'}
            </div>
          `;
          break;
        
        case 'floods':
          content = `
            <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #1E90FF;">
              🌊 Flood Zone
            </h3>
            <div style="font-size: 14px; line-height: 1.6;">
              <strong>Zone:</strong> ${properties.zone || 'N/A'}<br/>
              <strong>Risk Level:</strong> ${properties.riskLevel || 'N/A'}<br/>
              <strong>Description:</strong> ${properties.description || 'N/A'}
            </div>
          `;
          break;
        
        case 'transit':
          content = `
            <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #FF6347;">
              🚌 Transit Route
            </h3>
            <div style="font-size: 14px; line-height: 1.6;">
              <strong>Route:</strong> ${properties.routeNumber || 'N/A'}<br/>
              <strong>Name:</strong> ${properties.name || 'N/A'}<br/>
              <strong>Type:</strong> ${properties.type || 'N/A'}
            </div>
          `;
          break;
        
        case 'parks':
          content = `
            <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #32CD32;">
              🏞️ Park & Recreation
            </h3>
            <div style="font-size: 14px; line-height: 1.6;">
              <strong>Name:</strong> ${properties.name || 'N/A'}<br/>
              <strong>Type:</strong> ${properties.type || 'N/A'}<br/>
              <strong>Acres:</strong> ${properties.acres || 'N/A'}
            </div>
          `;
          break;
        
        case 'utilities':
          content = `
            <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #FF8C00;">
              ⚡ Utility Line
            </h3>
            <div style="font-size: 14px; line-height: 1.6;">
              <strong>Type:</strong> ${properties.type || 'N/A'}<br/>
              <strong>Operator:</strong> ${properties.operator || 'N/A'}<br/>
              <strong>Status:</strong> ${properties.status || 'N/A'}
            </div>
          `;
          break;
        
        default:
          content = `
            <div style="font-size: 14px;">
              <strong>Feature Properties:</strong><br/>
              ${Object.entries(properties).map(([key, value]) => 
                `<strong>${key}:</strong> ${value}`
              ).join('<br/>')}
            </div>
          `;
      }
      
      return baseStyle + content + '</div>';
    }
  }, [layers]);

  // Handle layer visibility changes
  const handleLayerToggle = (layerId: string, visible: boolean) => {
    setLayers(layers.map(layer => 
      layer.id === layerId ? { ...layer, visible } : layer
    ));
    
    // TODO: Implement actual map layer visibility control
    // For now, just update state
  };

  // Handle layer opacity changes
  const handleLayerOpacityChange = (layerId: string, opacity: number) => {
    setLayers(layers.map(layer => 
      layer.id === layerId ? { ...layer, opacity } : layer
    ));
    
    // TODO: Implement actual map layer opacity control
  };

  // GIS tool handlers
  const handleBufferZone = (radiusMiles: number) => {
    console.log("Creating buffer zone with radius:", radiusMiles);
    setBufferZoneVisible(true);
  };

  const handleMeasureDistance = () => {
    setMeasurementMode(prev => prev === "distance" ? null : "distance");
  };

  const handleDrawPolygon = () => {
    console.log("Activating polygon drawing tool");
    // TODO: Implement polygon drawing
  };

  const handleClearTools = () => {
    console.log("Clearing all GIS tools");
    setBufferZoneVisible(false);
    setMeasurementMode(null);
    setSpatialQueryMode(false);
    setQueryResults(null);
  };

  // Helper function to get layer color for display
  const getLayerColorForDisplay = (layerId: string): string => {
    const colors: Record<string, string> = {
      'zoning': '#FFD700',
      'schools': '#4169E1',
      'floods': '#1E90FF',
      'transit': '#FF6347',
      'parks': '#32CD32',
      'utilities': '#FF8C00',
    };
    return colors[layerId] || '#808080';
  };

  // Helper function to format feature attributes for display
  const formatFeatureAttributes = (layerId: string, properties: any): React.ReactElement => {
    const renderAttribute = (label: string, value: any) => (
      <div key={label} className="flex justify-between">
        <span className="text-muted-foreground">{label}:</span>
        <span className="font-medium">{value || 'N/A'}</span>
      </div>
    );

    switch (layerId) {
      case 'zoning':
        return (
          <div className="space-y-1">
            {renderAttribute('Zone', properties.zone)}
            {renderAttribute('Type', properties.zoneType)}
            {renderAttribute('Description', properties.description)}
          </div>
        );
      case 'schools':
        return (
          <div className="space-y-1">
            {renderAttribute('District', properties.name)}
            {renderAttribute('Type', properties.type)}
            {renderAttribute('Grades', properties.grades)}
          </div>
        );
      case 'floods':
        return (
          <div className="space-y-1">
            {renderAttribute('Zone', properties.zone)}
            {renderAttribute('Risk Level', properties.riskLevel)}
            {renderAttribute('Description', properties.description)}
          </div>
        );
      case 'transit':
        return (
          <div className="space-y-1">
            {renderAttribute('Route', properties.routeNumber)}
            {renderAttribute('Name', properties.name)}
            {renderAttribute('Type', properties.type)}
          </div>
        );
      case 'parks':
        return (
          <div className="space-y-1">
            {renderAttribute('Name', properties.name)}
            {renderAttribute('Type', properties.type)}
            {renderAttribute('Acres', properties.acres)}
          </div>
        );
      case 'utilities':
        return (
          <div className="space-y-1">
            {renderAttribute('Type', properties.type)}
            {renderAttribute('Operator', properties.operator)}
            {renderAttribute('Status', properties.status)}
          </div>
        );
      default:
        return (
          <div className="space-y-1">
            {Object.entries(properties).map(([key, value]) =>
              renderAttribute(key, value as any)
            )}
          </div>
        );
    }
  };  return (
    <DashboardLayout>
      {/* Full-screen map container */}
      <div className="fixed inset-0 top-16">
        <div ref={mapContainer} className="w-full h-full" />

        {/* Floating search bar - top center */}
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-10">
          <div className="w-96 bg-background/95 backdrop-blur-xl rounded-full shadow-2xl border border-primary/20">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search properties..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setAutocompleteOpen(e.target.value.length > 0);
                }}
                onFocus={() => setAutocompleteOpen(searchQuery.length > 0)}
                className="pl-12 pr-12 h-12 border-0 bg-transparent rounded-full focus-visible:ring-0"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setAutocompleteOpen(false);
                  }}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
            
            {/* Autocomplete Dropdown */}
            <SearchAutocomplete
              suggestions={getSearchSuggestions()}
              onSelect={(suggestion) => {
                // Save to recent searches
                const propertyId = parseInt(suggestion.id);
                setRecentSearches(prev => {
                  const updated = [propertyId, ...prev.filter(id => id !== propertyId)];
                  return updated.slice(0, 5); // Keep only 5 most recent
                });
                
                // Select property and fly to it
                setSelectedProperty(propertyId);
                setSearchQuery("");
                setAutocompleteOpen(false);
                
                // Fly to property on map
                const property = properties.find((p: any) => p.id === propertyId);
                if (property && property.longitude && property.latitude && map.current) {
                  map.current.flyTo({
                    center: [parseFloat(property.longitude), parseFloat(property.latitude)],
                    zoom: 16,
                    duration: 1500,
                  });
                }
              }}
              isOpen={autocompleteOpen}
              searchQuery={searchQuery}
            />
          </div>
        </div>

        {/* Property count badge - top left */}
        <div className="absolute top-6 left-6 z-10 flex flex-col gap-3">
          <Badge className="bg-background/95 backdrop-blur-xl text-foreground border-primary/20 px-4 py-2 text-sm">
            {properties.length} Properties
          </Badge>
          
          {/* Value Range Legend */}
          <div 
            className="rounded-2xl shadow-lg overflow-hidden"
            style={{
              background: "rgba(11, 16, 32, 0.85)",
              backdropFilter: "blur(24px) saturate(180%)",
              border: "1px solid rgba(0, 255, 238, 0.2)",
            }}
          >
            <div className="px-3 py-2">
              <div className="text-xs font-semibold text-cyan-400/80 uppercase tracking-wider mb-2">
                Market Value
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-xs text-white/80">&lt; $200k</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span className="text-xs text-white/80">$200k - $400k</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-xs text-white/80">&gt; $400k</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Map Legend */}
        <MapLegend
          layers={layers}
          onLayerToggle={handleLayerToggle}
        />

        {/* Measurement Tools */}
        <MeasurementTools
          map={map.current}
          mode={measurementMode}
          onModeChange={setMeasurementMode}
        />

        {/* FAB Menu - bottom right */}
        <div className="absolute bottom-8 right-8 z-10 flex flex-col items-end gap-3">
          {/* Expanded FAB options */}
          {fabMenuOpen && (
            <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-4 duration-200">
              <TactileButton
                variant={heatmapVisible ? "neon" : "clay"}
                onClick={() => setHeatmapVisible(!heatmapVisible)}
                className="rounded-full w-14 h-14"
              >
                <Flame className="h-6 w-6" />
              </TactileButton>
              <TactileButton
                variant={comparisonMode ? "neon" : "clay"}
                onClick={() => {
                  setComparisonMode(!comparisonMode);
                  if (!comparisonMode) {
                    setSelectedProperty(null);
                    setSelectedProperties([]);
                  }
                }}
                className="rounded-full w-14 h-14"
                title="Compare Properties"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </TactileButton>
              <TactileButton
                variant="clay"
                onClick={() => setGisToolsOpen(!gisToolsOpen)}
                className="rounded-full w-14 h-14"
              >
                <Settings className="h-6 w-6" />
              </TactileButton>
              <TactileButton
                variant="clay"
                onClick={() => {
                  if (selectedPropertyData && neighborhoodStats && queryResults) {
                    exportSpatialQueryToCSV(
                      {
                        id: selectedPropertyData.id,
                        address: selectedPropertyData.address || "N/A",
                        parcelNumber: selectedPropertyData.parcelId || "N/A",
                        assessedValue: selectedPropertyData.totalValue || 0,
                        squareFootage: selectedPropertyData.squareFeet || 0,
                        yearBuilt: selectedPropertyData.yearBuilt || 0,
                        propertyType: selectedPropertyData.propertyType || "N/A",
                        latitude: selectedPropertyData.latitude || "0",
                        longitude: selectedPropertyData.longitude || "0"
                      },
                      {
                        medianValue: neighborhoodStats.medianValue,
                        medianSquareFootage: neighborhoodStats.avgSquareFootage,
                        medianPricePerSqFt: neighborhoodStats.avgPricePerSqFt,
                        propertyTypes: {},
                        averageAge: neighborhoodStats.avgAge,
                        propertyCount: neighborhoodStats.propertyCount
                      },
                      queryResults
                    );
                  }
                }}
                className="rounded-full w-14 h-14"
              >
                <Download className="h-6 w-6" />
              </TactileButton>
            </div>
          )}

          {/* Main FAB toggle */}
          <TactileButton
            variant="neon"
            onClick={() => setFabMenuOpen(!fabMenuOpen)}
            className="rounded-full w-16 h-16 shadow-2xl"
          >
            <Target className={`h-7 w-7 transition-transform ${fabMenuOpen ? "rotate-45" : ""}`} />
          </TactileButton>
        </div>

        {/* GIS Tools Panel - slide from right */}
        {gisToolsOpen && (
          <LiquidPanel 
            enableWarp
            className="absolute top-0 right-0 bottom-0 w-80 z-30 animate-in slide-in-from-right duration-300 p-6 overflow-y-auto rounded-l-3xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">GIS Tools</h3>
              <Button variant="ghost" size="sm" onClick={() => setGisToolsOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <GISTools
              onBufferZone={handleBufferZone}
              onMeasureDistance={handleMeasureDistance}
              onDrawPolygon={handleDrawPolygon}
              onClearTools={handleClearTools}
              selectedProperty={selectedPropertyData ? {
                latitude: parseFloat(selectedPropertyData.latitude || "0"),
                longitude: parseFloat(selectedPropertyData.longitude || "0")
              } : null}
              spatialQueryMode={spatialQueryMode}
              onToggleSpatialQuery={() => setSpatialQueryMode(!spatialQueryMode)}
            />
            <div className="mt-6">
              <LayerManager
                layers={layers}
                onLayerToggle={handleLayerToggle}
                onLayerOpacityChange={handleLayerOpacityChange}
              />
            </div>
          </LiquidPanel>
        )}

        {/* Slide-up Property Detail Panel */}
        {((selectedProperty && selectedPropertyData) || (comparisonMode && selectedProperties.length > 0)) && (
          <div className="absolute bottom-0 left-0 right-0 z-40 animate-in slide-in-from-bottom duration-300">
            <LiquidPanel 
              enableBreathe
              className="border-t border-primary/20 shadow-2xl rounded-t-3xl max-h-[70vh] overflow-y-auto"
            >
              {/* Panel Header */}
              <div className="sticky top-0 bg-background/95 backdrop-blur-xl border-b border-primary/10 p-6 flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-foreground mb-1">
                    {comparisonMode ? `Comparing ${selectedProperties.length} Properties` : (selectedPropertyData?.address || "Unknown Address")}
                  </h2>
                  {!comparisonMode && (
                    <p className="text-sm text-muted-foreground">
                      Parcel: {selectedPropertyData?.parcelId || "N/A"}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {comparisonMode && selectedProperties.length > 0 && (
                    <>
                      <TactileButton variant="chrome" className="gap-2 px-4 py-2 text-sm" onClick={() => {
                        const data = selectedProperties.map(id => properties.find((p: any) => p.id === id)).filter(Boolean).map((p: any) => ({
                          id: p.id, address: p.address || "N/A", parcelId: p.parcelId || "N/A", totalValue: p.totalValue || 0,
                          squareFeet: p.squareFeet || 0, yearBuilt: p.yearBuilt || 0, propertyType: p.propertyType || "N/A",
                          latitude: p.latitude || "0", longitude: p.longitude || "0"
                        }));
                        import('@/lib/comparisonExport').then(({ exportComparisonCSV }) => exportComparisonCSV(data));
                      }}><Download className="h-4 w-4" />CSV</TactileButton>
                      <TactileButton variant="chrome" className="gap-2 px-4 py-2 text-sm" onClick={() => {
                        const data = selectedProperties.map(id => properties.find((p: any) => p.id === id)).filter(Boolean).map((p: any) => ({
                          id: p.id, address: p.address || "N/A", parcelId: p.parcelId || "N/A", totalValue: p.totalValue || 0,
                          squareFeet: p.squareFeet || 0, yearBuilt: p.yearBuilt || 0, propertyType: p.propertyType || "N/A",
                          latitude: p.latitude || "0", longitude: p.longitude || "0"
                        }));
                        import('@/lib/comparisonExport').then(({ exportComparisonPDF }) => exportComparisonPDF(data));
                      }}><FileText className="h-4 w-4" />PDF</TactileButton>
                    </>
                  )}
                  <Button variant="ghost" size="sm" className="rounded-full hover:bg-muted" onClick={() => {
                    if (comparisonMode) { setSelectedProperties([]); setComparisonMode(false); } else { setSelectedProperty(null); }
                  }}><X className="h-5 w-5" /></Button>
                </div>
              </div>

              {/* Panel Content */}
              <div className="p-6 space-y-6">
                {/* Comparison Mode: Side-by-side properties */}
                {comparisonMode && selectedProperties.length > 0 ? (
                  <>
                  <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
                    {selectedProperties.map(propId => {
                      const prop = properties.find((p: any) => p.id === propId);
                      if (!prop) return null;
                      
                      const values = selectedProperties.map(id => {
                        const p = properties.find((p: any) => p.id === id);
                        return p?.totalValue || 0;
                      });
                      const maxValue = Math.max(...values);
                      const minValue = Math.min(...values.filter(v => v > 0));
                      const isHighest = prop.totalValue === maxValue;
                      const isLowest = prop.totalValue === minValue && minValue > 0;
                      
                      return (
                        <div key={propId} className="bg-muted/30 rounded-xl p-4 space-y-3 relative">
                          <button
                            onClick={() => setSelectedProperties(prev => prev.filter(id => id !== propId))}
                            className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
                          >
                            <X className="h-4 w-4" />
                          </button>
                          <div>
                            <div className="text-xs font-semibold text-primary mb-1">Property {selectedProperties.indexOf(propId) + 1}</div>
                            <div className="text-sm font-medium text-foreground line-clamp-2">{prop.address || "Unknown"}</div>
                            <div className="text-xs text-muted-foreground">{prop.parcelId}</div>
                          </div>
                          
                          {/* Property Image Preview */}
                          {prop.latitude && prop.longitude && (
                            <PropertyImagePreview
                              propertyId={propId}
                              latitude={parseFloat(prop.latitude)}
                              longitude={parseFloat(prop.longitude)}
                              mapType={propertyImageViews[propId] || 'roadmap'}
                              onToggle={(type) => setPropertyImageViews(prev => ({ ...prev, [propId]: type }))}
                            />
                          )}
                          
                          <div className="space-y-2">
                            <div className={`p-2 rounded-lg ${isHighest ? 'bg-green-500/20 border border-green-500/30' : 'bg-muted/50'}`}>
                              <div className="text-xs text-muted-foreground">Value</div>
                              <div className="text-lg font-bold">${prop.totalValue?.toLocaleString() || "N/A"}</div>
                            </div>
                            <div className="p-2 rounded-lg bg-muted/50">
                              <div className="text-xs text-muted-foreground mb-2">Value Trend</div>
                              <PropertyHistoryChart propertyId={propId} />
                            </div>
                            <div className="p-2 rounded-lg bg-muted/50">
                              <div className="text-xs text-muted-foreground">Sqft</div>
                              <div className="text-sm font-semibold">{prop.squareFeet?.toLocaleString() || "N/A"}</div>
                            </div>
                            <div className="p-2 rounded-lg bg-muted/50">
                              <div className="text-xs text-muted-foreground">Year</div>
                              <div className="text-sm font-semibold">{prop.yearBuilt || "N/A"}</div>
                            </div>
                            <div className="p-2 rounded-lg bg-muted/50">
                              <div className="text-xs text-muted-foreground">Type</div>
                              <div className="text-sm font-semibold">{prop.propertyType || "N/A"}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Aggregate Statistics */}
                  <div className="mt-6 pt-6 border-t border-primary/10">
                    <KineticText className="text-sm font-semibold mb-4">
                      Comparison Summary
                    </KineticText>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {(() => {
                        const validProps = selectedProperties.map(id => properties.find((p: any) => p.id === id)).filter(Boolean);
                        const values = validProps.map((p: any) => p.totalValue || 0).filter(v => v > 0);
                        const sqfts = validProps.map((p: any) => p.squareFeet || 0).filter(v => v > 0);
                        const years = validProps.map((p: any) => p.yearBuilt || 0).filter(v => v > 0);
                        
                        const avgValue = values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
                        const medianSqft = sqfts.length > 0 ? sqfts.sort((a, b) => a - b)[Math.floor(sqfts.length / 2)] : 0;
                        const avgYear = years.length > 0 ? Math.round(years.reduce((a, b) => a + b, 0) / years.length) : 0;
                        const avgPricePerSqft = values.length > 0 && sqfts.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / sqfts.reduce((a, b) => a + b, 0)) : 0;
                        
                        return (
                          <>
                            <div className="bg-primary/10 rounded-xl p-4 border border-primary/20">
                              <div className="text-xs text-muted-foreground mb-1">Average Value</div>
                              <div className="text-xl font-bold text-primary">${avgValue.toLocaleString()}</div>
                            </div>
                            <div className="bg-muted/30 rounded-xl p-4">
                              <div className="text-xs text-muted-foreground mb-1">Median Sqft</div>
                              <div className="text-xl font-bold text-foreground">{medianSqft.toLocaleString()}</div>
                            </div>
                            <div className="bg-muted/30 rounded-xl p-4">
                              <div className="text-xs text-muted-foreground mb-1">Avg Year Built</div>
                              <div className="text-xl font-bold text-foreground">{avgYear}</div>
                            </div>
                            <div className="bg-muted/30 rounded-xl p-4">
                              <div className="text-xs text-muted-foreground mb-1">Avg $/Sqft</div>
                              <div className="text-xl font-bold text-foreground">${avgPricePerSqft}</div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                  </>
                ) : selectedPropertyData ? (
                  <>
                    {/* Single Property View: Key Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-muted/50 rounded-xl p-4">
                        <div className="text-xs text-muted-foreground mb-1">Assessed Value</div>
                        <div className="text-xl font-bold text-primary">
                          ${selectedPropertyData.totalValue?.toLocaleString() || "N/A"}
                        </div>
                      </div>
                      <div className="bg-muted/50 rounded-xl p-4">
                        <div className="text-xs text-muted-foreground mb-1">Square Footage</div>
                        <div className="text-xl font-bold text-foreground">
                          {selectedPropertyData.squareFeet?.toLocaleString() || "N/A"} sqft
                        </div>
                      </div>
                      <div className="bg-muted/50 rounded-xl p-4">
                        <div className="text-xs text-muted-foreground mb-1">Year Built</div>
                        <div className="text-xl font-bold text-foreground">
                          {selectedPropertyData.yearBuilt || "N/A"}
                        </div>
                      </div>
                      <div className="bg-muted/50 rounded-xl p-4">
                        <div className="text-xs text-muted-foreground mb-1">Property Type</div>
                        <div className="text-xl font-bold text-foreground">
                          {selectedPropertyData.propertyType || "N/A"}
                        </div>
                      </div>
                    </div>
                  </>
                ) : null}

                {/* Neighborhood Stats - only show in single property mode */}
                {!comparisonMode && neighborhoodStats && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      Neighborhood Statistics
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Within 1-mile radius • {neighborhoodStats.propertyCount} properties analyzed
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <div className="bg-muted/30 rounded-lg p-3">
                        <div className="text-xs text-muted-foreground">Median Value</div>
                        <div className="text-lg font-bold text-foreground">
                          ${neighborhoodStats.medianValue?.toLocaleString() || "N/A"}
                        </div>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-3">
                        <div className="text-xs text-muted-foreground">Avg Sqft</div>
                        <div className="text-lg font-bold text-foreground">
                          {neighborhoodStats.avgSquareFootage?.toLocaleString() || "N/A"}
                        </div>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-3">
                        <div className="text-xs text-muted-foreground">Avg Price/sqft</div>
                        <div className="text-lg font-bold text-foreground">
                          ${neighborhoodStats.avgPricePerSqFt?.toFixed(2) || "N/A"}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    variant="default"
                    className="flex-1 rounded-full"
                    onClick={() => {
                      if (selectedPropertyData && neighborhoodStats && queryResults) {
                        exportSpatialQueryToCSV(
                          {
                            id: selectedPropertyData.id,
                            address: selectedPropertyData.address || "N/A",
                            parcelNumber: selectedPropertyData.parcelId || "N/A",
                            assessedValue: selectedPropertyData.totalValue || 0,
                            squareFootage: selectedPropertyData.squareFeet || 0,
                            yearBuilt: selectedPropertyData.yearBuilt || 0,
                            propertyType: selectedPropertyData.propertyType || "N/A",
                            latitude: selectedPropertyData.latitude || "0",
                            longitude: selectedPropertyData.longitude || "0"
                          },
                          {
                            medianValue: neighborhoodStats.medianValue,
                            medianSquareFootage: neighborhoodStats.avgSquareFootage,
                            medianPricePerSqFt: neighborhoodStats.avgPricePerSqFt,
                            propertyTypes: {},
                            averageAge: neighborhoodStats.avgAge,
                            propertyCount: neighborhoodStats.propertyCount
                          },
                          queryResults
                        );
                      }
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Report
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-full"
                    onClick={() => setBufferZoneVisible(!bufferZoneVisible)}
                  >
                    {bufferZoneVisible ? "Hide" : "Show"} Buffer Zone
                  </Button>
                </div>
              </div>
            </LiquidPanel>
          </div>
        )}
        
        {/* Cluster Tooltip */}
        {clusterTooltip && clusterTooltip.visible && (
          <ClusterTooltip
            x={clusterTooltip.x}
            y={clusterTooltip.y}
            propertyIds={clusterTooltip.propertyIds}
            onClose={() => setClusterTooltip(null)}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
