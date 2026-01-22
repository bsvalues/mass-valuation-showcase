import { DashboardLayout } from "@/components/DashboardLayout";
import { GISTools } from "@/components/GISTools";
import { LayerManager, defaultLayers, type Layer } from "@/components/LayerManager";
import { MapLegend } from "@/components/MapLegend";
import { trpc } from "@/lib/trpc";
import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, X, Flame, ChevronLeft, ChevronRight, Settings, Target } from "lucide-react";

export default function MapExplorer() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [gisToolsOpen, setGisToolsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [heatmapVisible, setHeatmapVisible] = useState(false);
  const [layers, setLayers] = useState<Layer[]>(defaultLayers);
  const [bufferZoneVisible, setBufferZoneVisible] = useState(false);
  const [spatialQueryMode, setSpatialQueryMode] = useState(false);
  const [queryResults, setQueryResults] = useState<any>(null);

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
    console.log("Activating distance measurement tool");
    // TODO: Implement distance measurement
  };

  const handleDrawPolygon = () => {
    console.log("Activating polygon drawing tool");
    // TODO: Implement polygon drawing
  };

  const handleClearTools = () => {
    console.log("Clearing all GIS tools");
    setBufferZoneVisible(false);
    // TODO: Clear other tools
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
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl text-primary flex items-center gap-2">
                  🗺️ TerraGAMA GIS Explorer
                </CardTitle>
                <CardDescription>
                  Advanced spatial analysis and property mapping • {properties.length} properties loaded
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={heatmapVisible ? "default" : "outline"}
                  size="sm"
                  onClick={() => setHeatmapVisible(!heatmapVisible)}
                  className="gap-2"
                >
                  <Flame className="h-4 w-4" />
                  {heatmapVisible ? "Hide" : "Show"} Heatmap
                </Button>
                <Button
                  variant={gisToolsOpen ? "default" : "outline"}
                  size="sm"
                  onClick={() => setGisToolsOpen(!gisToolsOpen)}
                  className="gap-2"
                >
                  <Settings className="h-4 w-4" />
                  GIS Tools
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              {/* Property List Sidebar */}
              {sidebarOpen && (
                <div className="w-80 flex-shrink-0 space-y-4">
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search address or parcel..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-10"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Property Count */}
                  <div className="text-sm text-muted-foreground">
                    {filteredProperties.length === properties.length
                      ? `${properties.length} properties`
                      : `${filteredProperties.length} of ${properties.length} properties`}
                  </div>

                  {/* Property List */}
                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                    {isLoading ? (
                      <div className="text-sm text-muted-foreground">Loading properties...</div>
                    ) : filteredProperties.length === 0 ? (
                      <div className="text-sm text-muted-foreground">
                        {searchQuery ? "No properties match your search" : "No properties found"}
                      </div>
                    ) : (
                      filteredProperties.map((property: any) => (
                        <button
                          key={property.id}
                          onClick={() => setSelectedProperty(property.id)}
                          className={`w-full text-left p-3 rounded-lg border transition-all ${
                            selectedProperty === property.id
                              ? "border-primary bg-primary/10"
                              : "border-border hover:border-primary/50 hover:bg-muted/50"
                          }`}
                        >
                          <div className="font-medium text-sm">
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

              {/* Toggle Sidebar Button */}
              <div className="flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="h-full"
                >
                  {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
              </div>

              {/* Map Container */}
              <div className="flex-1 flex gap-4">
                <div className="flex-1 relative">
                  <div
                    ref={mapContainer}
                    className="w-full h-[600px] rounded-lg overflow-hidden border border-border"
                  />
                  {/* Map Legend */}
                  <MapLegend
                    layers={layers}
                    onLayerToggle={handleLayerToggle}
                  />
                </div>

                {/* GIS Tools Panel */}
                {gisToolsOpen && (
                  <div className="w-80 flex-shrink-0 space-y-4">
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
                    <LayerManager
                      layers={layers}
                      onLayerToggle={handleLayerToggle}
                      onLayerOpacityChange={handleLayerOpacityChange}
                    />
                  </div>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              ✨ Click clusters to zoom in • Click individual markers to view property details
              {bufferZoneVisible && " • Buffer zone active (1-mile radius)"}
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

        {/* Spatial Query Results Panel */}
        {queryResults && (
          <Card className="neighborhood-stats-panel bg-card border-border shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Spatial Query Results
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Intersecting layers at ({queryResults.point.lat.toFixed(6)}, {queryResults.point.lng.toFixed(6)})
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setQueryResults(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.keys(queryResults.layers).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No layers intersect at this location</p>
                  <p className="text-sm mt-1">Try enabling more layers or clicking a different area</p>
                </div>
              ) : (
                Object.entries(queryResults.layers).map(([layerId, features]: [string, any]) => {
                  const layer = layers.find(l => l.id === layerId);
                  if (!layer) return null;

                  return (
                    <div key={layerId} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: getLayerColorForDisplay(layerId) }}
                        />
                        <h3 className="text-sm font-semibold">{layer.name}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {features.length} feature{features.length > 1 ? 's' : ''}
                        </Badge>
                      </div>
                      <div className="ml-6 space-y-2">
                        {features.map((feature: any, idx: number) => (
                          <div key={idx} className="p-3 bg-muted/50 rounded-lg text-sm">
                            {formatFeatureAttributes(layerId, feature)}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
