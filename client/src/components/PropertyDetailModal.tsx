import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Building2, Calendar, DollarSign, Home, MapPin, Ruler } from "lucide-react";

interface PropertyDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property: {
    parcelNumber: string | null;
    siteAddress: string | null;
    propertyType: string | null;
    buildingValue: string | null;
    landValue: string | null;
    totalValue: string | null;
    squareFootage: string | null;
    yearBuilt: string | null;
    latitude: string | null;
    longitude: string | null;
  } | null;
}

export function PropertyDetailModal({
  open,
  onOpenChange,
  property,
}: PropertyDetailModalProps) {
  if (!property) return null;

  const formatCurrency = (value: string | null) => {
    if (!value) return "$0";
    const num = parseFloat(value);
    if (isNaN(num)) return "$0";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatNumber = (value: string | null) => {
    if (!value) return "N/A";
    const num = parseFloat(value);
    if (isNaN(num)) return "N/A";
    return new Intl.NumberFormat("en-US").format(num);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-[rgba(10,14,26,0.95)] border-[#00FFFF]/20">
        <DialogHeader>
          <DialogTitle className="text-2xl text-[#00FFFF] flex items-center gap-2">
            <Building2 className="w-6 h-6" />
            Property Details
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Parcel #{property.parcelNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Address */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[#00FFFF] font-medium">
              <MapPin className="w-4 h-4" />
              <span>Address</span>
            </div>
            <p className="text-slate-200 text-lg">
              {property.siteAddress || "Address not available"}
            </p>
            <p className="text-slate-400 text-sm">
              {property.latitude}, {property.longitude}
            </p>
          </div>

          <Separator className="bg-[#00FFFF]/20" />

          {/* Property Type */}
          {property.propertyType && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[#00FFFF] font-medium">
                <Home className="w-4 h-4" />
                <span>Property Type</span>
              </div>
              <Badge variant="outline" className="bg-[#00FFFF]/10 text-[#00FFFF] border-[#00FFFF]/30">
                {property.propertyType}
              </Badge>
            </div>
          )}

          {/* Valuation */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[#00FFFF] font-medium">
              <DollarSign className="w-4 h-4" />
              <span>Assessed Value</span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-[rgba(0,255,255,0.05)] p-4 rounded-lg border border-[#00FFFF]/20">
                <p className="text-slate-400 text-sm mb-1">Building Value</p>
                <p className="text-slate-200 text-xl font-bold">
                  {formatCurrency(property.buildingValue)}
                </p>
              </div>
              <div className="bg-[rgba(0,255,255,0.05)] p-4 rounded-lg border border-[#00FFFF]/20">
                <p className="text-slate-400 text-sm mb-1">Land Value</p>
                <p className="text-slate-200 text-xl font-bold">
                  {formatCurrency(property.landValue)}
                </p>
              </div>
              <div className="bg-[rgba(0,255,255,0.1)] p-4 rounded-lg border border-[#00FFFF]/30">
                <p className="text-[#00FFFF] text-sm mb-1 font-medium">Total Value</p>
                <p className="text-[#00FFFF] text-xl font-bold">
                  {formatCurrency(property.totalValue)}
                </p>
              </div>
            </div>
          </div>

          <Separator className="bg-[#00FFFF]/20" />

          {/* Physical Characteristics */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[#00FFFF] font-medium">
                <Ruler className="w-4 h-4" />
                <span>Square Footage</span>
              </div>
              <p className="text-slate-200 text-lg">
                {property.squareFootage ? `${formatNumber(property.squareFootage)} sq ft` : "N/A"}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[#00FFFF] font-medium">
                <Calendar className="w-4 h-4" />
                <span>Year Built</span>
              </div>
              <p className="text-slate-200 text-lg">
                {property.yearBuilt || "N/A"}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
