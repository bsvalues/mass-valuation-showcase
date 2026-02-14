import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Home, Calendar, Maximize, Bed, Bath, DollarSign } from "lucide-react";

interface PropertyPreviewCardProps {
  property: {
    parcelId: string;
    address: string;
    sqft: number;
    yearBuilt: number;
    bedrooms: number;
    bathrooms: number;
    assessedValue: number;
    salePrice: number;
  };
  position: { x: number; y: number };
}

export function PropertyPreviewCard({ property, position }: PropertyPreviewCardProps) {
  const age = new Date().getFullYear() - property.yearBuilt;
  
  return (
    <div
      className="fixed z-50 pointer-events-none"
      style={{
        left: `${position.x + 20}px`,
        top: `${position.y - 100}px`,
      }}
    >
      <Card className="w-80 shadow-2xl border-2 border-primary/20 bg-background/95 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-semibold text-sm line-clamp-1">{property.address}</h4>
                <p className="text-xs text-muted-foreground font-mono">{property.parcelId}</p>
              </div>
              <Badge variant="outline" className="ml-2">
                <Home className="w-3 h-3 mr-1" />
                {age}y
              </Badge>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 text-xs">
                <Maximize className="w-3 h-3 text-muted-foreground" />
                <span className="font-medium">{property.sqft.toLocaleString()} sqft</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Calendar className="w-3 h-3 text-muted-foreground" />
                <span className="font-medium">{property.yearBuilt}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Bed className="w-3 h-3 text-muted-foreground" />
                <span className="font-medium">{property.bedrooms} beds</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Bath className="w-3 h-3 text-muted-foreground" />
                <span className="font-medium">{property.bathrooms} baths</span>
              </div>
            </div>

            {/* Values */}
            <div className="pt-2 border-t space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Assessed Value</span>
                <span className="font-semibold">${property.assessedValue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Sale Price</span>
                <span className="font-semibold">${property.salePrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Price/sqft</span>
                <span className="font-semibold">
                  ${Math.round(property.salePrice / property.sqft).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
