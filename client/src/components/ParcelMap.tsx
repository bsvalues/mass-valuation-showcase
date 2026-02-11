/**
 * ParcelMap Component - MapLibre visualization of parcel boundaries
 * Features: Click-to-highlight, parcel selection sync, hover popups
 */

import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Button } from './ui/button';
import { Home, Maximize2, Layers, DollarSign, Building2, Grid3x3 } from 'lucide-react';
import { Card } from './ui/card';

interface ParcelMapProps {
  parcels: Array<{
    id: number;
    parcelId: string;
    situsAddress: string | null;
    geometry: string | null;
    valueLand: number | null;
    valueBuilding: number | null;
    propertyType: string | null;
  }>;
  selectedParcelId?: string;
  onParcelClick?: (parcelId: string) => void;
  className?: string;
}

type LayerMode = 'boundaries' | 'value-heatmap' | 'property-type';

export function ParcelMap({ parcels, selectedParcelId, onParcelClick, className = '' }: ParcelMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const popup = useRef<maplibregl.Popup | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [layerMode, setLayerMode] = useState<LayerMode>('boundaries');
  const [clusteringEnabled, setClusteringEnabled] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm-tiles': {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors',
          },
        },
        layers: [
          {
            id: 'osm-tiles',
            type: 'raster',
            source: 'osm-tiles',
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      center: [-119.4, 46.2], // Default to Washington state center
      zoom: 10,
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      setMapLoaded(true);
    });

    popup.current = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      className: 'parcel-popup',
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Add parcel layers when map is loaded
  useEffect(() => {
    if (!map.current || !mapLoaded || parcels.length === 0) return;

    const validParcels = parcels.filter(p => p.geometry);
    if (validParcels.length === 0) return;

    // Convert parcels to GeoJSON
    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: validParcels.map(parcel => {
        let geometry;
        try {
          geometry = typeof parcel.geometry === 'string' 
            ? JSON.parse(parcel.geometry) 
            : parcel.geometry;
        } catch (e) {
          console.error('Failed to parse geometry for parcel', parcel.parcelId, e);
          return null;
        }

        return {
          type: 'Feature',
          properties: {
            id: parcel.id.toString(),
            parcelId: parcel.parcelId,
            address: parcel.situsAddress || 'No address',
            valueLand: parcel.valueLand || 0,
            valueBuilding: parcel.valueBuilding || 0,
            totalValue: (parcel.valueLand || 0) + (parcel.valueBuilding || 0),
            propertyType: parcel.propertyType || 'unknown',
          },
          geometry,
        };
      }).filter(Boolean) as GeoJSON.Feature[],
    };

    // Remove existing layers and sources if they exist
    if (map.current.getLayer('clusters')) map.current.removeLayer('clusters');
    if (map.current.getLayer('cluster-count')) map.current.removeLayer('cluster-count');
    if (map.current.getLayer('parcels-fill')) map.current.removeLayer('parcels-fill');
    if (map.current.getLayer('parcels-outline')) map.current.removeLayer('parcels-outline');
    if (map.current.getLayer('parcels-highlight')) map.current.removeLayer('parcels-highlight');
    if (map.current.getSource('parcels')) map.current.removeSource('parcels');

    // Add source with optional clustering
    map.current.addSource('parcels', {
      type: 'geojson',
      data: geojson,
      cluster: clusteringEnabled,
      clusterMaxZoom: 14, // Max zoom to cluster points on
      clusterRadius: 50, // Radius of each cluster when clustering points (defaults to 50)
      clusterProperties: {
        // Calculate sum of total values for cluster
        sumValue: ['+', ['get', 'totalValue']],
        // Count parcels in cluster
        count: ['+', 1],
      },
    });

    // Add fill layer with dynamic coloring based on layer mode
    const getFillPaint = () => {
      if (layerMode === 'value-heatmap') {
        // Color by total assessed value (heatmap)
        return {
          'fill-color': [
            'interpolate',
            ['linear'],
            ['get', 'totalValue'],
            0, '#0d47a1',        // Dark blue for low values
            100000, '#1976d2',   // Medium blue
            250000, '#4caf50',   // Green
            500000, '#ffeb3b',   // Yellow
            750000, '#ff9800',   // Orange
            1000000, '#f44336',  // Red for high values
          ] as any,
          'fill-opacity': 0.6,
        };
      } else if (layerMode === 'property-type') {
        // Color by property type
        return {
          'fill-color': [
            'match',
            ['get', 'propertyType'],
            'residential', '#2196F3',  // Blue
            'commercial', '#FF9800',   // Orange
            'industrial', '#9C27B0',   // Purple
            'agricultural', '#4CAF50', // Green
            '#757575',  // Gray for unknown
          ] as any,
          'fill-opacity': 0.6,
        };
      } else {
        // Standard transparent fill
        return {
          'fill-color': '#00D9D9',
          'fill-opacity': 0.1,
        };
      }
    };

    // Add cluster layers (only visible when clustering is enabled)
    if (clusteringEnabled) {
      // Cluster circles
      map.current.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'parcels',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count'],
            '#51bbd6', // Color for clusters with < 10 points
            10,
            '#f1f075', // Color for clusters with 10-50 points
            50,
            '#f28cb1', // Color for clusters with 50+ points
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            20, // Radius for clusters with < 10 points
            10,
            30, // Radius for clusters with 10-50 points
            50,
            40, // Radius for clusters with 50+ points
          ],
          'circle-opacity': 0.8,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff',
        },
      });

      // Cluster count labels
      map.current.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'parcels',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
          'text-size': 12,
        },
        paint: {
          'text-color': '#000',
        },
      });
    }

    // Add parcel fill layer (only for unclustered points)
    map.current.addLayer({
      id: 'parcels-fill',
      type: 'fill',
      source: 'parcels',
      filter: clusteringEnabled ? ['!', ['has', 'point_count']] : ['all'],
      paint: getFillPaint(),
    });

    // Add outline layer (only for unclustered points)
    map.current.addLayer({
      id: 'parcels-outline',
      type: 'line',
      source: 'parcels',
      filter: clusteringEnabled ? ['!', ['has', 'point_count']] : ['all'],
      paint: {
        'line-color': '#00D9D9',
        'line-width': 1.5,
        'line-opacity': 0.8,
      },
    });

    // Add highlight layer (will be filtered by selected parcel, only for unclustered points)
    map.current.addLayer({
      id: 'parcels-highlight',
      type: 'fill',
      source: 'parcels',
      filter: clusteringEnabled 
        ? ['all', ['!', ['has', 'point_count']], ['==', ['get', 'id'], '']]
        : ['==', ['get', 'id'], ''],
      paint: {
        'fill-color': '#00FFEE',
        'fill-opacity': 0.4,
      },
    });

    // Fit map to parcels bounds
    const bounds = new maplibregl.LngLatBounds();
    geojson.features.forEach(feature => {
      if (feature.geometry.type === 'Polygon') {
        feature.geometry.coordinates[0].forEach((coord: number[]) => {
          bounds.extend(coord as [number, number]);
        });
      } else if (feature.geometry.type === 'MultiPolygon') {
        feature.geometry.coordinates.forEach((polygon: number[][][]) => {
          polygon[0].forEach((coord: number[]) => {
            bounds.extend(coord as [number, number]);
          });
        });
      }
    });

    map.current.fitBounds(bounds, { padding: 50, maxZoom: 15 });

    // Add cluster click handler (zoom into cluster)
    if (clusteringEnabled) {
      map.current.on('click', 'clusters', (e) => {
        if (!map.current) return;
        const features = map.current.queryRenderedFeatures(e.point, {
          layers: ['clusters'],
        });
        if (features.length > 0 && features[0].geometry.type === 'Point') {
          // Zoom in by 2 levels when clicking a cluster
          map.current.easeTo({
            center: features[0].geometry.coordinates as [number, number],
            zoom: (map.current.getZoom() || 10) + 2,
            duration: 500,
          });
        }
      });

      // Add hover cursor for clusters
      map.current.on('mouseenter', 'clusters', () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer';
      });
      map.current.on('mouseleave', 'clusters', () => {
        if (map.current) map.current.getCanvas().style.cursor = '';
      });
    }

    // Add parcel click handler
    map.current.on('click', 'parcels-fill', (e) => {
      if (e.features && e.features.length > 0) {
        const feature = e.features[0];
        const parcelId = feature.properties?.id;
        if (parcelId && onParcelClick) {
          onParcelClick(parcelId);
        }
      }
    });

    // Add hover handler for popup
    map.current.on('mouseenter', 'parcels-fill', (e) => {
      if (map.current) map.current.getCanvas().style.cursor = 'pointer';
      
      if (e.features && e.features.length > 0 && popup.current) {
        const feature = e.features[0];
        const props = feature.properties;
        
        const coordinates = e.lngLat;
        const html = `
          <div class="text-xs">
            <div class="font-bold text-primary">${props?.parcelId || 'Unknown'}</div>
            <div class="text-muted-foreground">${props?.address || 'No address'}</div>
            <div class="mt-1 text-foreground">
              Total Value: $${((props?.totalValue || 0) as number).toLocaleString()}
            </div>
          </div>
        `;
        
        popup.current.setLngLat(coordinates).setHTML(html).addTo(map.current!);
      }
    });

    map.current.on('mouseleave', 'parcels-fill', () => {
      if (map.current) map.current.getCanvas().style.cursor = '';
      popup.current?.remove();
    });

  }, [mapLoaded, parcels, onParcelClick, clusteringEnabled]);

  // Update layer paint when layer mode changes
  useEffect(() => {
    if (!map.current || !mapLoaded || !map.current.getLayer('parcels-fill')) return;

    if (layerMode === 'value-heatmap') {
      map.current.setPaintProperty('parcels-fill', 'fill-color', [
        'interpolate',
        ['linear'],
        ['get', 'totalValue'],
        0, '#0d47a1',
        100000, '#1976d2',
        250000, '#4caf50',
        500000, '#ffeb3b',
        750000, '#ff9800',
        1000000, '#f44336',
      ] as any);
      map.current.setPaintProperty('parcels-fill', 'fill-opacity', 0.6);
    } else {
      map.current.setPaintProperty('parcels-fill', 'fill-color', '#00D9D9');
      map.current.setPaintProperty('parcels-fill', 'fill-opacity', 0.1);
    }
  }, [layerMode, mapLoaded]);

  // Update highlight when selected parcel changes
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    if (map.current.getLayer('parcels-highlight')) {
      map.current.setFilter('parcels-highlight', [
        '==',
        ['get', 'id'],
        selectedParcelId || '',
      ]);

      // Fly to selected parcel if exists
      if (selectedParcelId) {
        const source = map.current.getSource('parcels') as maplibregl.GeoJSONSource;
        if (source) {
          // @ts-ignore - _data is internal but we need it
          const data = source._data as GeoJSON.FeatureCollection;
          const feature = data.features.find(
            (f: any) => f.properties.id === selectedParcelId
          );
          
          if (feature && feature.geometry.type === 'Polygon') {
            const coords = feature.geometry.coordinates[0];
            const bounds = new maplibregl.LngLatBounds();
            coords.forEach((coord: number[]) => {
              bounds.extend(coord as [number, number]);
            });
            map.current.fitBounds(bounds, { padding: 100, maxZoom: 16, duration: 1000 });
          }
        }
      }
    }
  }, [selectedParcelId, mapLoaded]);

  const handleResetView = () => {
    if (!map.current || parcels.length === 0) return;

    const validParcels = parcels.filter(p => p.geometry);
    if (validParcels.length === 0) return;

    const bounds = new maplibregl.LngLatBounds();
    validParcels.forEach(parcel => {
      try {
        const geometry = typeof parcel.geometry === 'string' 
          ? JSON.parse(parcel.geometry) 
          : parcel.geometry;
        
        if (geometry.type === 'Polygon') {
          geometry.coordinates[0].forEach((coord: number[]) => {
            bounds.extend(coord as [number, number]);
          });
        }
      } catch (e) {
        // Skip invalid geometries
      }
    });

    map.current.fitBounds(bounds, { padding: 50, maxZoom: 15, duration: 1000 });
  };

  return (
    <div className={`relative ${className}`}>
      <div ref={mapContainer} className="w-full h-full rounded-lg overflow-hidden" />
      
      {/* Map controls */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={handleResetView}
          className="bg-background/90 backdrop-blur-sm border-primary/30 hover:bg-background/95 shadow-lg"
        >
          <Maximize2 className="w-4 h-4 mr-2" />
          Reset View
        </Button>
        
        {/* Layer mode controls */}
        <Card className="bg-background/90 backdrop-blur-sm border-primary/30 shadow-lg p-2">
          <div className="flex flex-col gap-1">
            <div className="text-xs font-medium text-muted-foreground px-2 mb-1 flex items-center gap-1">
              <Layers className="w-3 h-3" />
              Visualization
            </div>
            
            <Button
              size="sm"
              variant={layerMode === 'boundaries' ? 'default' : 'ghost'}
              onClick={() => setLayerMode('boundaries')}
              className="justify-start h-8 text-xs"
            >
              <Home className="w-3 h-3 mr-2" />
              Boundaries
            </Button>
            
            <Button
              size="sm"
              variant={layerMode === 'value-heatmap' ? 'default' : 'ghost'}
              onClick={() => setLayerMode('value-heatmap')}
              className="justify-start h-8 text-xs"
            >
              <DollarSign className="w-3 h-3 mr-2" />
              Value Heatmap
            </Button>
            
            <Button
              size="sm"
              variant={layerMode === 'property-type' ? 'default' : 'ghost'}
              onClick={() => setLayerMode('property-type')}
              className="justify-start h-8 text-xs"
            >
              <Building2 className="w-3 h-3 mr-2" />
              Property Type
            </Button>
            
            <div className="h-px bg-border my-1" />
            
            <Button
              size="sm"
              variant={clusteringEnabled ? 'default' : 'ghost'}
              onClick={() => setClusteringEnabled(!clusteringEnabled)}
              className="justify-start h-8 text-xs"
            >
              <Grid3x3 className="w-3 h-3 mr-2" />
              Clustering
            </Button>
          </div>
        </Card>
      </div>

      {/* Parcel count badge */}
      <div className="absolute bottom-4 left-4 z-10 bg-background/90 backdrop-blur-sm border border-primary/30 rounded-lg px-3 py-2 text-xs shadow-lg">
        <span className="text-muted-foreground">Parcels on map:</span>{' '}
        <span className="font-bold text-primary">{parcels.filter(p => p.geometry).length}</span>
      </div>
      
      {/* Property Type Legend (only visible in property-type mode) */}
      {layerMode === 'property-type' && (
        <Card className="absolute bottom-4 right-4 z-10 bg-background/90 backdrop-blur-sm border-primary/30 shadow-lg p-3">
          <div className="flex flex-col gap-2">
            <div className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              Property Types
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#2196F3' }} />
              <span className="text-xs">Residential</span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#FF9800' }} />
              <span className="text-xs">Commercial</span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#9C27B0' }} />
              <span className="text-xs">Industrial</span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#4CAF50' }} />
              <span className="text-xs">Agricultural</span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#757575' }} />
              <span className="text-xs">Unknown</span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
