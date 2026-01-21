import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useMemoizedFn } from "ahooks";

declare global {
  interface Window {
    google?: typeof google;
  }
}

const API_KEY = import.meta.env.VITE_FRONTEND_FORGE_API_KEY;
const FORGE_BASE_URL =
  import.meta.env.VITE_FRONTEND_FORGE_API_URL ||
  "https://forge.butterfly-effect.dev";
const MAPS_PROXY_URL = `${FORGE_BASE_URL}/v1/maps/proxy`;

function loadMapScript() {
  return new Promise(resolve => {
    const script = document.createElement("script");
    script.src = `${MAPS_PROXY_URL}/maps/api/js?key=${API_KEY}&v=weekly&libraries=visualization`;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.onload = () => {
      resolve(null);
      script.remove();
    };
    script.onerror = () => {
      console.error("Failed to load Google Maps script");
    };
    document.head.appendChild(script);
  });
}

interface PropertyHeatmapProps {
  properties: Array<{
    latitude: number;
    longitude: number;
    value: number;
  }>;
  isLoading?: boolean;
}

// Benton County, Washington coordinates
const BENTON_COUNTY_CENTER = {
  lat: 46.2396,
  lng: -119.2006,
};

export function PropertyHeatmap({ properties, isLoading }: PropertyHeatmapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [heatmap, setHeatmap] = useState<google.maps.visualization.HeatmapLayer | null>(null);
  const [error, setError] = useState<string | null>(null);

  const initMap = useMemoizedFn(async () => {
    await loadMapScript();
    if (!mapRef.current) return;

    try {
      const googleMap = new window.google!.maps.Map(mapRef.current, {
        center: BENTON_COUNTY_CENTER,
        zoom: 10,
        mapTypeId: "roadmap",
        styles: [
          {
            elementType: "geometry",
            stylers: [{ color: "#1d2c4d" }],
          },
          {
            elementType: "labels.text.fill",
            stylers: [{ color: "#8ec3b9" }],
          },
          {
            elementType: "labels.text.stroke",
            stylers: [{ color: "#1a3646" }],
          },
          {
            featureType: "administrative.country",
            elementType: "geometry.stroke",
            stylers: [{ color: "#4b6878" }],
          },
          {
            featureType: "administrative.land_parcel",
            elementType: "labels.text.fill",
            stylers: [{ color: "#64779e" }],
          },
          {
            featureType: "administrative.province",
            elementType: "geometry.stroke",
            stylers: [{ color: "#4b6878" }],
          },
          {
            featureType: "landscape.man_made",
            elementType: "geometry.stroke",
            stylers: [{ color: "#334e87" }],
          },
          {
            featureType: "landscape.natural",
            elementType: "geometry",
            stylers: [{ color: "#023e58" }],
          },
          {
            featureType: "poi",
            elementType: "geometry",
            stylers: [{ color: "#283d6a" }],
          },
          {
            featureType: "poi",
            elementType: "labels.text.fill",
            stylers: [{ color: "#6f9ba5" }],
          },
          {
            featureType: "poi",
            elementType: "labels.text.stroke",
            stylers: [{ color: "#1d2c4d" }],
          },
          {
            featureType: "poi.park",
            elementType: "geometry.fill",
            stylers: [{ color: "#023e58" }],
          },
          {
            featureType: "poi.park",
            elementType: "labels.text.fill",
            stylers: [{ color: "#3C7680" }],
          },
          {
            featureType: "road",
            elementType: "geometry",
            stylers: [{ color: "#304a7d" }],
          },
          {
            featureType: "road",
            elementType: "labels.text.fill",
            stylers: [{ color: "#98a5be" }],
          },
          {
            featureType: "road",
            elementType: "labels.text.stroke",
            stylers: [{ color: "#1d2c4d" }],
          },
          {
            featureType: "road.highway",
            elementType: "geometry",
            stylers: [{ color: "#2c6675" }],
          },
          {
            featureType: "road.highway",
            elementType: "geometry.stroke",
            stylers: [{ color: "#255763" }],
          },
          {
            featureType: "road.highway",
            elementType: "labels.text.fill",
            stylers: [{ color: "#b0d5ce" }],
          },
          {
            featureType: "road.highway",
            elementType: "labels.text.stroke",
            stylers: [{ color: "#023e58" }],
          },
          {
            featureType: "transit",
            elementType: "labels.text.fill",
            stylers: [{ color: "#98a5be" }],
          },
          {
            featureType: "transit",
            elementType: "labels.text.stroke",
            stylers: [{ color: "#1d2c4d" }],
          },
          {
            featureType: "transit.line",
            elementType: "geometry.fill",
            stylers: [{ color: "#283d6a" }],
          },
          {
            featureType: "transit.station",
            elementType: "geometry",
            stylers: [{ color: "#3a4762" }],
          },
          {
            featureType: "water",
            elementType: "geometry",
            stylers: [{ color: "#0e1626" }],
          },
          {
            featureType: "water",
            elementType: "labels.text.fill",
            stylers: [{ color: "#4e6d70" }],
          },
        ],
      });

      setMap(googleMap);
    } catch (err) {
      console.error("Error initializing Google Maps:", err);
      setError("Failed to load map. Please refresh the page.");
    }
  });

  // Initialize Google Maps
  useEffect(() => {
    initMap();
  }, [initMap]);

  // Update heatmap when properties change
  useEffect(() => {
    if (!map || !properties || properties.length === 0) {
      if (heatmap) {
        heatmap.setMap(null);
        setHeatmap(null);
      }
      return;
    }

    try {
      // Convert properties to heatmap data points
      const heatmapData = properties
        .filter((p) => p.latitude && p.longitude && p.value)
        .map((property) => {
          return {
            location: new google.maps.LatLng(property.latitude, property.longitude),
            weight: property.value,
          };
        });

      // Remove existing heatmap
      if (heatmap) {
        heatmap.setMap(null);
      }

      // Create new heatmap layer
      const newHeatmap = new google.maps.visualization.HeatmapLayer({
        data: heatmapData,
        map: map,
        radius: 20,
        opacity: 0.6,
        gradient: [
          "rgba(0, 255, 255, 0)",
          "rgba(0, 255, 255, 1)",
          "rgba(0, 191, 255, 1)",
          "rgba(0, 127, 255, 1)",
          "rgba(0, 63, 255, 1)",
          "rgba(0, 0, 255, 1)",
          "rgba(63, 0, 191, 1)",
          "rgba(127, 0, 127, 1)",
          "rgba(191, 0, 63, 1)",
          "rgba(255, 0, 0, 1)",
        ],
      });

      setHeatmap(newHeatmap);
    } catch (err) {
      console.error("Error creating heatmap:", err);
      setError("Failed to create heatmap visualization.");
    }
  }, [map, properties]);

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-500">Property Value Heatmap</CardTitle>
          <CardDescription>Benton County, Washington</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[500px] flex items-center justify-center text-red-500">
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-[#00FFEE]">Property Value Heatmap</CardTitle>
        <CardDescription>
          Color-coded density visualization for Benton County, Washington
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {isLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
              <Loader2 className="w-8 h-8 animate-spin text-[#00FFEE]" />
            </div>
          )}
          <div ref={mapRef} className="h-[500px] w-full rounded-lg overflow-hidden" />
          
          {/* Legend */}
          <div className="mt-4 flex items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: "rgba(0, 255, 255, 1)" }} />
              <span className="text-xs text-muted-foreground">Low Value</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: "rgba(0, 0, 255, 1)" }} />
              <span className="text-xs text-muted-foreground">Medium Value</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: "rgba(255, 0, 0, 1)" }} />
              <span className="text-xs text-muted-foreground">High Value</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
