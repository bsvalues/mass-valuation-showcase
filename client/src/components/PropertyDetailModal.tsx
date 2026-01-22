import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Building2, Calendar, DollarSign, Home, MapPin, Ruler, TrendingUp } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface PropertyDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: number | null;
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
  propertyId,
  property,
}: PropertyDetailModalProps) {
  // Fetch property history when modal opens
  const { data: history, isLoading: historyLoading } = trpc.parcels.getHistory.useQuery(
    { parcelId: propertyId! },
    { enabled: open && propertyId !== null }
  );

  if (!property) return null;

  const formatCurrency = (value: string | null | number) => {
    if (!value) return "$0";
    const num = typeof value === 'string' ? parseFloat(value) : value;
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

  // Prepare chart data
  const chartData = history?.map(h => ({
    year: h.assessmentYear,
    "Total Value": h.totalValue || 0,
    "Building Value": h.buildingValue || 0,
    "Land Value": h.landValue || 0,
  })).reverse() || []; // Reverse to show oldest to newest

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[rgba(10,14,26,0.95)] border-[#00FFFF]/20">
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
              <span>Current Assessed Value</span>
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

          {/* Historical Assessment Chart */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[#00FFFF] font-medium">
              <TrendingUp className="w-4 h-4" />
              <span>Assessment History (Past Decade)</span>
            </div>
            
            {historyLoading ? (
              <div className="bg-[rgba(0,255,255,0.05)] p-8 rounded-lg border border-[#00FFFF]/20 flex items-center justify-center">
                <p className="text-slate-400">Loading historical data...</p>
              </div>
            ) : chartData.length > 0 ? (
              <div className="bg-[rgba(0,255,255,0.05)] p-4 rounded-lg border border-[#00FFFF]/20">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#00FFFF20" />
                    <XAxis 
                      dataKey="year" 
                      stroke="#00FFFF"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                      stroke="#00FFFF"
                      style={{ fontSize: '12px' }}
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(10,14,26,0.95)',
                        border: '1px solid rgba(0,255,255,0.3)',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Legend 
                      wrapperStyle={{ color: '#00FFFF' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="Total Value" 
                      stroke="#00FFFF" 
                      strokeWidth={3}
                      dot={{ fill: '#00FFFF', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="Building Value" 
                      stroke="#60A5FA" 
                      strokeWidth={2}
                      dot={{ fill: '#60A5FA', r: 3 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="Land Value" 
                      stroke="#34D399" 
                      strokeWidth={2}
                      dot={{ fill: '#34D399', r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
                <p className="text-slate-400 text-xs mt-2 text-center">
                  Showing {chartData.length} years of assessment data
                </p>
              </div>
            ) : (
              <div className="bg-[rgba(0,255,255,0.05)] p-8 rounded-lg border border-[#00FFFF]/20 flex items-center justify-center">
                <p className="text-slate-400">No historical assessment data available</p>
              </div>
            )}
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
