import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Layers, Map, Building, School, Trees, Bus, Droplet, Zap } from "lucide-react";
import { useState } from "react";

export interface Layer {
  id: string;
  name: string;
  description: string;
  visible: boolean;
  opacity: number;
  icon: React.ReactNode;
  color: string;
}

export interface LayerManagerProps {
  layers: Layer[];
  onLayerToggle: (layerId: string, visible: boolean) => void;
  onLayerOpacityChange: (layerId: string, opacity: number) => void;
}

export function LayerManager({
  layers,
  onLayerToggle,
  onLayerOpacityChange,
}: LayerManagerProps) {
  return (
    <Card className="bg-sidebar/95 backdrop-blur-sm border-sidebar-border">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-sidebar-primary" />
          <CardTitle className="text-lg">Layer Management</CardTitle>
        </div>
        <CardDescription className="text-sidebar-foreground/70">
          Control map overlays and data layers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {layers.map((layer, index) => (
          <div key={layer.id}>
            {index > 0 && <Separator className="bg-sidebar-border mb-3" />}
            <div className="space-y-2">
              {/* Layer Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`text-${layer.color}`}>
                    {layer.icon}
                  </div>
                  <div>
                    <Label className="text-sm font-medium cursor-pointer">
                      {layer.name}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {layer.description}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={layer.visible}
                  onCheckedChange={(checked) => onLayerToggle(layer.id, checked)}
                />
              </div>

              {/* Opacity Slider (only when visible) */}
              {layer.visible && (
                <div className="pl-8 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Opacity</span>
                    <span className="text-sidebar-primary font-mono">
                      {Math.round(layer.opacity * 100)}%
                    </span>
                  </div>
                  <Slider
                    value={[layer.opacity * 100]}
                    onValueChange={([value]) => onLayerOpacityChange(layer.id, value / 100)}
                    min={0}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// Default layer configurations
export const defaultLayers: Layer[] = [
  {
    id: "properties",
    name: "Properties",
    description: "Property parcels and markers",
    visible: true,
    opacity: 1.0,
    icon: <Building className="h-4 w-4" />,
    color: "sidebar-primary",
  },
  {
    id: "zoning",
    name: "Zoning Districts",
    description: "Land use zoning boundaries",
    visible: false,
    opacity: 0.6,
    icon: <Map className="h-4 w-4" />,
    color: "blue-500",
  },
  {
    id: "schools",
    name: "School Districts",
    description: "School attendance boundaries",
    visible: false,
    opacity: 0.5,
    icon: <School className="h-4 w-4" />,
    color: "green-500",
  },
  {
    id: "parks",
    name: "Parks & Recreation",
    description: "Public parks and green spaces",
    visible: false,
    opacity: 0.7,
    icon: <Trees className="h-4 w-4" />,
    color: "emerald-500",
  },
  {
    id: "transit",
    name: "Transit Routes",
    description: "Public transportation lines",
    visible: false,
    opacity: 0.8,
    icon: <Bus className="h-4 w-4" />,
    color: "purple-500",
  },
  {
    id: "flood",
    name: "Flood Zones",
    description: "FEMA flood hazard areas",
    visible: false,
    opacity: 0.4,
    icon: <Droplet className="h-4 w-4" />,
    color: "red-500",
  },
  {
    id: "utilities",
    name: "Utility Lines",
    description: "Power, water, and sewer lines",
    visible: false,
    opacity: 0.6,
    icon: <Zap className="h-4 w-4" />,
    color: "yellow-500",
  },
];
