import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Circle, Ruler, Pentagon, Layers, MapPin, Target } from "lucide-react";
import { useState } from "react";

export interface GISToolsProps {
  onBufferZone: (radiusMiles: number) => void;
  onMeasureDistance: () => void;
  onDrawPolygon: () => void;
  onClearTools: () => void;
  selectedProperty: { latitude: number; longitude: number } | null;
  spatialQueryMode: boolean;
  onToggleSpatialQuery: () => void;
}

export function GISTools({
  onBufferZone,
  onMeasureDistance,
  onDrawPolygon,
  onClearTools,
  selectedProperty,
  spatialQueryMode,
  onToggleSpatialQuery,
}: GISToolsProps) {
  const [bufferRadius, setBufferRadius] = useState("0.5");
  const [measurementMode, setMeasurementMode] = useState<"distance" | "area" | null>(null);

  return (
    <Card className="bg-sidebar/95 backdrop-blur-sm border-sidebar-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-sidebar-primary" />
            <CardTitle className="text-lg">GIS Analysis Tools</CardTitle>
          </div>
        </div>
        <CardDescription className="text-sidebar-foreground/70">
          Advanced spatial analysis and measurement
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Buffer Zone Analysis */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Circle className="h-4 w-4 text-sidebar-primary" />
            Buffer Zone Analysis
          </Label>
          <div className="flex gap-2">
            <Select value={bufferRadius} onValueChange={setBufferRadius}>
              <SelectTrigger className="flex-1 bg-sidebar-accent border-sidebar-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0.25">0.25 miles</SelectItem>
                <SelectItem value="0.5">0.5 miles</SelectItem>
                <SelectItem value="1.0">1.0 mile</SelectItem>
                <SelectItem value="2.0">2.0 miles</SelectItem>
                <SelectItem value="5.0">5.0 miles</SelectItem>
              </SelectContent>
            </Select>
            <Button
              size="sm"
              onClick={() => onBufferZone(parseFloat(bufferRadius))}
              disabled={!selectedProperty}
              className="bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
            >
              Create
            </Button>
          </div>
          {!selectedProperty && (
            <p className="text-xs text-muted-foreground">
              Select a property to create buffer zone
            </p>
          )}
        </div>

        <Separator className="bg-sidebar-border" />

        {/* Measurement Tools */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Ruler className="h-4 w-4 text-sidebar-primary" />
            Measurement Tools
          </Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              variant={measurementMode === "distance" ? "default" : "outline"}
              onClick={() => {
                setMeasurementMode(measurementMode === "distance" ? null : "distance");
                onMeasureDistance();
              }}
              className="text-xs"
            >
              <Ruler className="h-3 w-3 mr-1" />
              Distance
            </Button>
            <Button
              size="sm"
              variant={measurementMode === "area" ? "default" : "outline"}
              onClick={() => {
                setMeasurementMode(measurementMode === "area" ? null : "area");
              }}
              className="text-xs"
            >
              <Pentagon className="h-3 w-3 mr-1" />
              Area
            </Button>
          </div>
          {measurementMode && (
            <p className="text-xs text-sidebar-primary">
              Click on map to measure {measurementMode}
            </p>
          )}
        </div>

        <Separator className="bg-sidebar-border" />

        {/* Drawing Tools */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Pentagon className="h-4 w-4 text-sidebar-primary" />
            Drawing Tools
          </Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onDrawPolygon}
              className="text-xs"
            >
              <Pentagon className="h-3 w-3 mr-1" />
              Polygon
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onClearTools}
              className="text-xs"
            >
              Clear All
            </Button>
          </div>
        </div>

        <Separator className="bg-sidebar-border" />

        {/* Spatial Query Tool */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Target className="h-4 w-4 text-sidebar-primary" />
            Spatial Query
          </Label>
          <Button
            size="sm"
            variant={spatialQueryMode ? "default" : "outline"}
            onClick={onToggleSpatialQuery}
            className="w-full text-xs"
          >
            <Target className="h-3 w-3 mr-1" />
            {spatialQueryMode ? "Query Mode Active" : "Activate Query Mode"}
          </Button>
          {spatialQueryMode && (
            <p className="text-xs text-sidebar-primary">
              Click anywhere on map to query all intersecting layers
            </p>
          )}
        </div>

        <Separator className="bg-sidebar-border" />

        {/* Proximity Analysis */}
        {selectedProperty && (
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-sidebar-primary" />
              Proximity Analysis
            </Label>
            <div className="space-y-1 text-xs text-sidebar-foreground/80">
              <div className="flex justify-between">
                <span>Selected Property:</span>
                <span className="font-mono text-sidebar-primary">
                  {selectedProperty.latitude.toFixed(6)}, {selectedProperty.longitude.toFixed(6)}
                </span>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="w-full text-xs"
              onClick={() => {
                // This will be connected to GIS router
                console.log("Calculate proximity factors");
              }}
            >
              <MapPin className="h-3 w-3 mr-1" />
              Calculate Location Factors
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
