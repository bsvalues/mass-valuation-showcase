import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { PropertyDetailModal } from "./PropertyDetailModal";
import { trpc } from "@/lib/trpc";

declare global {
  interface Window {
    google?: typeof google;
    initMap?: () => void;
  }
}

const API_KEY = import.meta.env.VITE_FRONTEND_FORGE_API_KEY;
const FORGE_BASE_URL =
  import.meta.env.VITE_FRONTEND_FORGE_API_URL ||
  "https://forge.butterfly-effect.dev";
const MAPS_PROXY_URL = `${FORGE_BASE_URL}/v1/maps/proxy`;

// BENTON COUNTY, WASHINGTON - DO NOT CHANGE
const BENTON_COUNTY_CENTER = {
  lat: 46.2396,
  lng: -119.2006,
};

interface PropertyHeatmapProps {
  properties: Array<{
    id?: number;
    parcelNumber?: string;
    latitude: number;
    longitude: number;
    value: number;
  }>;
  isLoading?: boolean;
}

export function PropertyHeatmap({ properties, isLoading }: PropertyHeatmapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [heatmap, setHeatmap] = useState<google.maps.visualization.HeatmapLayer | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Fetch property details when a property is selected
  const { data: propertyDetails } = trpc.parcels.getById.useQuery(
    { id: selectedPropertyId! },
    { enabled: selectedPropertyId !== null }
  );

  // Load Google Maps script
  useEffect(() => {
    if (window.google?.maps) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = `${MAPS_PROXY_URL}/maps/api/js?key=${API_KEY}&v=weekly&libraries=visualization`;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.onload = () => {
      setScriptLoaded(true);
    };
    script.onerror = () => {
      setError("Failed to load Google Maps");
    };
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, []);

  // Initialize map
  useEffect(() => {
    if (!scriptLoaded || !mapRef.current || map) return;

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
            elementType: "labels.text.stroke",
            stylers: [{ color: "#1a3646" }],
          },
          {
            elementType: "labels.text.fill",
            stylers: [{ color: "#8ec3b9" }],
          },
          {
            featureType: "water",
            elementType: "geometry",
            stylers: [{ color: "#0e1626" }],
          },
        ],
      });

      setMap(googleMap);
    } catch (err) {
      console.error("Error initializing map:", err);
      setError("Failed to initialize map");
    }
  }, [scriptLoaded, map]);

  // Update heatmap and markers when properties change
  useEffect(() => {
    if (!map || !window.google?.maps?.visualization) return;

    // Remove old heatmap
    if (heatmap) {
      heatmap.setMap(null);
    }

    // Remove old markers
    markers.forEach(marker => marker.setMap(null));
    setMarkers([]);

    if (properties.length === 0) return;

    try {
      // Convert properties to heatmap data
      const heatmapData = properties.map(p => ({
        location: new google.maps.LatLng(p.latitude, p.longitude),
        weight: p.value,
      }));

      // Create new heatmap
      const newHeatmap = new google.maps.visualization.HeatmapLayer({
        data: heatmapData,
        radius: 20,
        opacity: 0.7,
        gradient: [
          "rgba(0, 255, 255, 0)",
          "rgba(0, 255, 255, 1)",
          "rgba(0, 191, 255, 1)",
          "rgba(0, 127, 255, 1)",
          "rgba(0, 63, 255, 1)",
          "rgba(0, 0, 255, 1)",
          "rgba(255, 0, 0, 1)",
        ],
      });

      newHeatmap.setMap(map);
      setHeatmap(newHeatmap);

      // Add clickable markers (show every 10th property to avoid clutter)
      const newMarkers: google.maps.Marker[] = [];
      properties.forEach((property, index) => {
        if (index % 10 === 0 && property.id) {
          const marker = new google.maps.Marker({
            position: { lat: property.latitude, lng: property.longitude },
            map: map,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 6,
              fillColor: "#00FFFF",
              fillOpacity: 0.8,
              strokeColor: "#FFFFFF",
              strokeWeight: 2,
            },
            title: property.parcelNumber || "Property",
          });

          marker.addListener("click", () => {
            setSelectedPropertyId(property.id!);
            setModalOpen(true);
          });

          newMarkers.push(marker);
        }
      });
      setMarkers(newMarkers);

      // Fit bounds to show all properties
      if (heatmapData.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        heatmapData.forEach(point => {
          bounds.extend(point.location);
        });
        map.fitBounds(bounds);

        // Limit zoom level
        google.maps.event.addListenerOnce(map, 'bounds_changed', () => {
          const zoom = map.getZoom();
          if (zoom && zoom > 12) {
            map.setZoom(12);
          }
        });
      }
    } catch (err) {
      console.error("Error creating heatmap:", err);
      setError("Failed to create heatmap");
    }
  }, [map, properties]);

  if (error) {
    return (
      <Card className="border-red-500/20 bg-red-500/5">
        <CardHeader>
          <CardTitle className="text-red-400">Error</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card className="terra-card bg-[rgba(10,14,26,0.6)]">
        <CardHeader>
          <CardTitle className="text-[#00FFFF]">Property Value Heatmap</CardTitle>
          <CardDescription className="text-slate-400">
            Color-coded density visualization for Benton County, Washington. Click cyan markers for property details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10 rounded-lg">
                <Loader2 className="w-8 h-8 animate-spin text-[#00FFFF]" />
              </div>
            )}
            <div
              ref={mapRef}
              className="w-full h-[500px] rounded-lg border border-[#00FFFF]/20"
            />
            <div className="mt-4 flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-[#00FFFF]"></div>
                <span className="text-slate-300">Low Value</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                <span className="text-slate-300">Medium Value</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-red-500"></div>
                <span className="text-slate-300">High Value</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {propertyDetails && (
        <PropertyDetailModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          property={{
            parcelNumber: propertyDetails.parcelId,
            siteAddress: propertyDetails.address,
            propertyType: propertyDetails.propertyType,
            buildingValue: propertyDetails.buildingValue?.toString() || null,
            landValue: propertyDetails.landValue?.toString() || null,
            totalValue: propertyDetails.totalValue?.toString() || null,
            squareFootage: propertyDetails.squareFeet?.toString() || null,
            yearBuilt: propertyDetails.yearBuilt?.toString() || null,
            latitude: propertyDetails.latitude,
            longitude: propertyDetails.longitude,
          }}
        />
      )}
    </>
  );
}
