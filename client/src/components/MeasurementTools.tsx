import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Ruler, Pentagon, X, Navigation } from "lucide-react";
import { useState, useEffect } from "react";
import type { Map as MapLibreMap } from "maplibre-gl";

export interface Measurement {
  type: "distance" | "area";
  value: number;
  unit: string;
  coordinates: [number, number][];
}

export interface MeasurementToolsProps {
  map: MapLibreMap | null;
  mode: "distance" | "area" | null;
  onModeChange: (mode: "distance" | "area" | null) => void;
}

export function MeasurementTools({ map, mode, onModeChange }: MeasurementToolsProps) {
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [currentPoints, setCurrentPoints] = useState<[number, number][]>([]);
  const [unit, setUnit] = useState<"imperial" | "metric">("imperial");

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (coord1: [number, number], coord2: [number, number]): number => {
    const R = 6371; // Earth's radius in kilometers
    const lat1 = coord1[1] * Math.PI / 180;
    const lat2 = coord2[1] * Math.PI / 180;
    const deltaLat = (coord2[1] - coord1[1]) * Math.PI / 180;
    const deltaLng = (coord2[0] - coord1[0]) * Math.PI / 180;

    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = R * c;

    // Convert to imperial or metric
    if (unit === "imperial") {
      const distanceMiles = distanceKm * 0.621371;
      return distanceMiles < 0.1 ? distanceKm * 3280.84 : distanceMiles; // feet or miles
    } else {
      return distanceKm < 0.1 ? distanceKm * 1000 : distanceKm; // meters or kilometers
    }
  };

  // Calculate total distance for a line
  const calculateTotalDistance = (coords: [number, number][]): number => {
    let total = 0;
    for (let i = 0; i < coords.length - 1; i++) {
      total += calculateDistance(coords[i], coords[i + 1]);
    }
    return total;
  };

  // Calculate area using shoelace formula (for small areas, approximation)
  const calculateArea = (coords: [number, number][]): number => {
    if (coords.length < 3) return 0;

    // Close the polygon if not already closed
    const closedCoords = coords[0][0] === coords[coords.length - 1][0] &&
                         coords[0][1] === coords[coords.length - 1][1]
      ? coords
      : [...coords, coords[0]];

    let area = 0;
    for (let i = 0; i < closedCoords.length - 1; i++) {
      area += closedCoords[i][0] * closedCoords[i + 1][1];
      area -= closedCoords[i + 1][0] * closedCoords[i][1];
    }
    area = Math.abs(area) / 2;

    // Convert from degrees² to real area (approximation at mid-latitude)
    const avgLat = closedCoords.reduce((sum, coord) => sum + coord[1], 0) / closedCoords.length;
    const metersPerDegreeLat = 111320;
    const metersPerDegreeLng = 111320 * Math.cos(avgLat * Math.PI / 180);
    const areaM2 = area * metersPerDegreeLat * metersPerDegreeLng;

    // Convert to imperial or metric
    if (unit === "imperial") {
      const areaAcres = areaM2 * 0.000247105;
      return areaAcres < 0.01 ? areaM2 * 10.7639 : areaAcres; // sq ft or acres
    } else {
      const areaHectares = areaM2 / 10000;
      return areaHectares < 0.01 ? areaM2 : areaHectares; // m² or hectares
    }
  };

  // Format measurement value with appropriate unit
  const formatMeasurement = (value: number, type: "distance" | "area"): string => {
    if (type === "distance") {
      if (unit === "imperial") {
        return value < 0.1 ? `${value.toFixed(0)} ft` : `${value.toFixed(2)} mi`;
      } else {
        return value < 0.1 ? `${value.toFixed(0)} m` : `${value.toFixed(2)} km`;
      }
    } else {
      if (unit === "imperial") {
        return value < 0.01 ? `${value.toFixed(0)} sq ft` : `${value.toFixed(2)} acres`;
      } else {
        return value < 0.01 ? `${value.toFixed(0)} m²` : `${value.toFixed(2)} ha`;
      }
    }
  };

  // Handle map clicks for measurement
  useEffect(() => {
    if (!map || !mode) return;

    const handleClick = (e: any) => {
      const coords: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      setCurrentPoints(prev => [...prev, coords]);

      // Add marker at clicked point
      const el = document.createElement('div');
      el.className = 'measurement-marker';
      el.style.width = '10px';
      el.style.height = '10px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = '#00FFFF';
      el.style.border = '2px solid white';
      el.style.cursor = 'pointer';

      new (window as any).maplibregl.Marker({ element: el })
        .setLngLat(coords)
        .addTo(map);
    };

    const handleDoubleClick = () => {
      if (currentPoints.length < 2) return;

      // Calculate measurement
      let value: number;
      let measurementUnit: string;

      if (mode === "distance") {
        value = calculateTotalDistance(currentPoints);
        measurementUnit = unit === "imperial" 
          ? (value < 0.1 ? "ft" : "mi")
          : (value < 0.1 ? "m" : "km");
      } else {
        value = calculateArea(currentPoints);
        measurementUnit = unit === "imperial"
          ? (value < 0.01 ? "sq ft" : "acres")
          : (value < 0.01 ? "m²" : "ha");
      }

      setMeasurements(prev => [...prev, {
        type: mode,
        value,
        unit: measurementUnit,
        coordinates: currentPoints
      }]);

      // Draw line or polygon on map
      if (map.getSource('measurement-temp')) {
        map.removeLayer('measurement-temp-line');
        if (map.getLayer('measurement-temp-fill')) {
          map.removeLayer('measurement-temp-fill');
        }
        map.removeSource('measurement-temp');
      }

      const geojson: GeoJSON.Feature = mode === "distance" ? {
        type: 'Feature',
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: currentPoints
        }
      } : {
        type: 'Feature',
        properties: {},
        geometry: {
          type: "Polygon",
          coordinates: [currentPoints]
        }
      };

      map.addSource('measurement-result-' + Date.now(), {
        type: 'geojson',
        data: geojson
      });

      if (mode === "distance") {
        map.addLayer({
          id: 'measurement-result-line-' + Date.now(),
          type: 'line',
          source: 'measurement-result-' + Date.now(),
          paint: {
            'line-color': '#00FFFF',
            'line-width': 3,
            'line-dasharray': [2, 2]
          }
        });
      } else {
        map.addLayer({
          id: 'measurement-result-fill-' + Date.now(),
          type: 'fill',
          source: 'measurement-result-' + Date.now(),
          paint: {
            'fill-color': '#00FFFF',
            'fill-opacity': 0.2
          }
        });
        map.addLayer({
          id: 'measurement-result-outline-' + Date.now(),
          type: 'line',
          source: 'measurement-result-' + Date.now(),
          paint: {
            'line-color': '#00FFFF',
            'line-width': 2
          }
        });
      }

      setCurrentPoints([]);
    };

    map.on('click', handleClick);
    map.on('dblclick', handleDoubleClick);

    return () => {
      map.off('click', handleClick);
      map.off('dblclick', handleDoubleClick);
    };
  }, [map, mode, currentPoints, unit]);

  // Draw temporary line/polygon as user clicks
  useEffect(() => {
    if (!map || !mode || currentPoints.length === 0) return;

    // Remove existing temporary layer
    if (map.getSource('measurement-temp')) {
      map.removeLayer('measurement-temp-line');
      if (map.getLayer('measurement-temp-fill')) {
        map.removeLayer('measurement-temp-fill');
      }
      map.removeSource('measurement-temp');
    }

    const geojson: GeoJSON.Feature = mode === "distance" ? {
      type: 'Feature',
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: currentPoints
      }
    } : {
      type: 'Feature',
      properties: {},
      geometry: {
        type: "Polygon",
        coordinates: [currentPoints]
      }
    };

    map.addSource('measurement-temp', {
      type: 'geojson',
      data: geojson
    });

    if (mode === "distance") {
      map.addLayer({
        id: 'measurement-temp-line',
        type: 'line',
        source: 'measurement-temp',
        paint: {
          'line-color': '#00FFFF',
          'line-width': 2,
          'line-opacity': 0.6
        }
      });
    } else if (currentPoints.length >= 3) {
      map.addLayer({
        id: 'measurement-temp-fill',
        type: 'fill',
        source: 'measurement-temp',
        paint: {
          'fill-color': '#00FFFF',
          'fill-opacity': 0.1
        }
      });
      map.addLayer({
        id: 'measurement-temp-line',
        type: 'line',
        source: 'measurement-temp',
        paint: {
          'line-color': '#00FFFF',
          'line-width': 2,
          'line-opacity': 0.6
        }
      });
    }
  }, [map, mode, currentPoints]);

  const clearMeasurements = () => {
    setMeasurements([]);
    setCurrentPoints([]);
    if (map) {
      // Remove all measurement layers and sources
      const style = map.getStyle();
      if (style && style.layers) {
        style.layers.forEach((layer: any) => {
          if (layer.id.startsWith('measurement-')) {
            map.removeLayer(layer.id);
          }
        });
      }
      if (style && style.sources) {
        Object.keys(style.sources).forEach((sourceId: string) => {
          if (sourceId.startsWith('measurement-')) {
            map.removeSource(sourceId);
          }
        });
      }
      // Remove markers
      document.querySelectorAll('.measurement-marker').forEach(el => el.remove());
    }
  };

  if (!mode && measurements.length === 0) return null;

  return (
    <Card className="absolute top-4 left-4 w-80 bg-sidebar/95 backdrop-blur-sm border-sidebar-border shadow-lg z-10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {mode === "distance" ? <Ruler className="h-5 w-5" /> : <Pentagon className="h-5 w-5" />}
            Measurement Tools
          </CardTitle>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              onModeChange(null);
              clearMeasurements();
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Unit Toggle */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={unit === "imperial" ? "default" : "outline"}
            onClick={() => setUnit("imperial")}
            className="flex-1 text-xs"
          >
            Imperial
          </Button>
          <Button
            size="sm"
            variant={unit === "metric" ? "default" : "outline"}
            onClick={() => setUnit("metric")}
            className="flex-1 text-xs"
          >
            Metric
          </Button>
        </div>

        {/* Current Measurement */}
        {mode && currentPoints.length > 0 && (
          <div className="p-3 bg-sidebar-accent rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">Current {mode}</div>
            <div className="text-lg font-bold text-sidebar-primary">
              {mode === "distance" && currentPoints.length >= 2
                ? formatMeasurement(calculateTotalDistance(currentPoints), "distance")
                : mode === "area" && currentPoints.length >= 3
                ? formatMeasurement(calculateArea(currentPoints), "area")
                : "Click to add points"}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {currentPoints.length} point{currentPoints.length !== 1 ? "s" : ""} • Double-click to finish
            </div>
          </div>
        )}

        {/* Measurements List */}
        {measurements.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Saved Measurements</div>
              <Badge variant="secondary">{measurements.length}</Badge>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {measurements.map((measurement, index) => (
                <div
                  key={index}
                  className="p-2 bg-sidebar-accent rounded border border-sidebar-border"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {measurement.type === "distance" ? (
                        <Ruler className="h-4 w-4 text-sidebar-primary" />
                      ) : (
                        <Pentagon className="h-4 w-4 text-sidebar-primary" />
                      )}
                      <span className="text-sm capitalize">{measurement.type}</span>
                    </div>
                    <span className="text-sm font-bold text-sidebar-primary">
                      {formatMeasurement(measurement.value, measurement.type)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={clearMeasurements}
              className="w-full text-xs"
            >
              Clear All Measurements
            </Button>
          </div>
        )}

        {/* Instructions */}
        {mode && (
          <div className="p-2 bg-sidebar-accent/50 rounded text-xs text-muted-foreground">
            <Navigation className="h-3 w-3 inline mr-1" />
            Click on map to add points. Double-click to finish {mode} measurement.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
