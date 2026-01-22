import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ChevronDown, ChevronUp, Layers } from "lucide-react";
import { useState } from "react";
import type { Layer } from "./LayerManager";

export interface MapLegendProps {
  layers: Layer[];
  onLayerToggle: (layerId: string, visible: boolean) => void;
}

export function MapLegend({ layers, onLayerToggle }: MapLegendProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Get only visible layers (excluding properties layer)
  const visibleLayers = layers.filter(l => l.visible && l.id !== 'properties');
  
  // Auto-hide when no layers are visible
  if (visibleLayers.length === 0) {
    return null;
  }

  // Helper function to get layer color
  const getLayerColor = (layerId: string): string => {
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

  return (
    <Card className="absolute bottom-4 right-4 w-72 bg-sidebar/95 backdrop-blur-sm border-sidebar-border shadow-lg z-10">
      <CardHeader className="pb-2 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-sidebar-primary" />
            <CardTitle className="text-sm">Map Legend</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {visibleLayers.length}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-2 pt-2">
          {visibleLayers.map((layer) => (
            <div
              key={layer.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-sidebar-accent transition-colors"
            >
              <div
                className="w-4 h-4 rounded flex-shrink-0"
                style={{ backgroundColor: getLayerColor(layer.id) }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-sidebar-foreground truncate">
                  {layer.name}
                </div>
                <div className="text-xs text-sidebar-foreground/70 truncate">
                  {layer.description}
                </div>
              </div>
              <Switch
                checked={layer.visible}
                onCheckedChange={(checked) => onLayerToggle(layer.id, checked)}
                className="flex-shrink-0"
              />
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  );
}
