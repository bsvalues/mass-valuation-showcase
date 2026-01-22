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

  // Fetch nearby properties
  const { data: nearbyProperties, isLoading: nearbyLoading } = trpc.parcels.getNearbyProperties.useQuery(
    { 
      id: propertyId!,
      latitude: parseFloat(property?.latitude || '0'),
      longitude: parseFloat(property?.longitude || '0'),
      radius: 0.5,
      limit: 5,
    },
    { enabled: open && propertyId !== null && !!property?.latitude && !!property?.longitude }
  );

  // Fetch neighborhood statistics
  const { data: neighborhoodStats, isLoading: statsLoading } = trpc.parcels.getNeighborhoodStats.useQuery(
    {
      latitude: parseFloat(property?.latitude || '0'),
      longitude: parseFloat(property?.longitude || '0'),
      radius: 1.0,
    },
    { enabled: open && !!property?.latitude && !!property?.longitude }
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

        {/* Neighborhood Statistics Section */}
        <Separator className="bg-slate-700" />
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#00FFFF]" />
            <h3 className="text-xl font-semibold text-[#00FFFF]">Neighborhood Statistics</h3>
            <Badge variant="outline" className="bg-[#00FFFF]/10 text-[#00FFFF] border-[#00FFFF]/30">
              Within 1 mi
            </Badge>
          </div>

          {statsLoading ? (
            <div className="text-slate-400 text-sm">Loading neighborhood statistics...</div>
          ) : neighborhoodStats && neighborhoodStats.propertyCount > 0 ? (
            <>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <Home className="w-4 h-4 text-[#00FFFF]" />
                  <span className="text-sm text-slate-400">Properties</span>
                </div>
                <p className="text-2xl font-bold text-white">{neighborhoodStats.propertyCount.toLocaleString()}</p>
              </div>

              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-[#00FFFF]" />
                  <span className="text-sm text-slate-400">Median Value</span>
                </div>
                <p className="text-2xl font-bold text-white">{formatCurrency(neighborhoodStats.medianValue)}</p>
                {property.totalValue && (
                  <p className="text-xs text-slate-500 mt-1">
                    {parseFloat(property.totalValue) > neighborhoodStats.medianValue ? (
                      <span className="text-green-400">↑ Above median</span>
                    ) : parseFloat(property.totalValue) < neighborhoodStats.medianValue ? (
                      <span className="text-amber-400">↓ Below median</span>
                    ) : (
                      <span className="text-slate-400">= At median</span>
                    )}
                  </p>
                )}
              </div>

              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <Ruler className="w-4 h-4 text-[#00FFFF]" />
                  <span className="text-sm text-slate-400">Avg. Sq Ft</span>
                </div>
                <p className="text-2xl font-bold text-white">{neighborhoodStats.avgSquareFootage.toLocaleString()}</p>
                {property.squareFootage && (
                  <p className="text-xs text-slate-500 mt-1">
                    {parseFloat(property.squareFootage) > neighborhoodStats.avgSquareFootage ? (
                      <span className="text-green-400">↑ Above average</span>
                    ) : parseFloat(property.squareFootage) < neighborhoodStats.avgSquareFootage ? (
                      <span className="text-amber-400">↓ Below average</span>
                    ) : (
                      <span className="text-slate-400">= At average</span>
                    )}
                  </p>
                )}
              </div>

              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-[#00FFFF]" />
                  <span className="text-sm text-slate-400">Avg. $/Sq Ft</span>
                </div>
                <p className="text-2xl font-bold text-white">${neighborhoodStats.avgPricePerSqFt.toLocaleString()}</p>
                {property.totalValue && property.squareFootage && (
                  <p className="text-xs text-slate-500 mt-1">
                    {(() => {
                      const propertyPricePerSqFt = parseFloat(property.totalValue) / parseFloat(property.squareFootage);
                      return propertyPricePerSqFt > neighborhoodStats.avgPricePerSqFt ? (
                        <span className="text-green-400">↑ Above average</span>
                      ) : propertyPricePerSqFt < neighborhoodStats.avgPricePerSqFt ? (
                        <span className="text-amber-400">↓ Below average</span>
                      ) : (
                        <span className="text-slate-400">= At average</span>
                      );
                    })()}
                  </p>
                )}
              </div>
            </div>

            {/* Property Type Distribution */}
            {neighborhoodStats.propertyTypeDistribution && neighborhoodStats.propertyTypeDistribution.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-semibold text-[#00FFFF] mb-3">Property Type Distribution</h4>
                <div className="space-y-2">
                  {neighborhoodStats.propertyTypeDistribution.map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-slate-300">{item.type}</span>
                          <span className="text-xs text-slate-400">{item.count} ({item.percentage}%)</span>
                        </div>
                        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#00FFFF] to-[#00D9D9] transition-all duration-300"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Average Age of Homes */}
            {neighborhoodStats.avgAge > 0 && (
              <div className="mt-6">
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-[#00FFFF]" />
                    <span className="text-sm text-slate-400">Average Age of Homes</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{neighborhoodStats.avgAge} years</p>
                  {property.yearBuilt && (
                    <p className="text-xs text-slate-500 mt-1">
                      {(() => {
                        const currentYear = new Date().getFullYear();
                        const propertyAge = currentYear - parseInt(property.yearBuilt);
                        return propertyAge > neighborhoodStats.avgAge ? (
                          <span className="text-amber-400">↓ Older than average</span>
                        ) : propertyAge < neighborhoodStats.avgAge ? (
                          <span className="text-green-400">↑ Newer than average</span>
                        ) : (
                          <span className="text-slate-400">= At average age</span>
                        );
                      })()}
                    </p>
                  )}
                </div>
              </div>
            )}
            </>
          ) : (
            <div className="text-slate-400 text-sm">No neighborhood data available</div>
          )}
        </div>

        {/* Similar Properties Nearby Section */}
        <Separator className="bg-slate-700" />
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#00FFFF]" />
            <h3 className="text-xl font-semibold text-[#00FFFF]">Similar Properties Nearby</h3>
            <Badge variant="outline" className="bg-[#00FFFF]/10 text-[#00FFFF] border-[#00FFFF]/30">
              Within 0.5 mi
            </Badge>
          </div>

          {nearbyLoading ? (
            <p className="text-slate-400 text-sm">Loading nearby properties...</p>
          ) : !nearbyProperties || nearbyProperties.length === 0 ? (
            <p className="text-slate-400 text-sm">No comparable properties found within 0.5 miles.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-2 px-3 text-[#00FFFF] font-medium">Address</th>
                    <th className="text-right py-2 px-3 text-[#00FFFF] font-medium">Total Value</th>
                    <th className="text-right py-2 px-3 text-[#00FFFF] font-medium">Sq Ft</th>
                    <th className="text-right py-2 px-3 text-[#00FFFF] font-medium">Year Built</th>
                    <th className="text-right py-2 px-3 text-[#00FFFF] font-medium">Distance</th>
                  </tr>
                </thead>
                <tbody>
                  {nearbyProperties.map((nearby: any, idx: number) => (
                    <tr key={idx} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-3 text-slate-200">
                        {nearby.siteAddress || nearby.parcelId || 'N/A'}
                      </td>
                      <td className="text-right py-3 px-3 text-slate-200 font-medium">
                        {formatCurrency(nearby.totalValue)}
                      </td>
                      <td className="text-right py-3 px-3 text-slate-300">
                        {nearby.squareFootage ? formatNumber(nearby.squareFootage) : 'N/A'}
                      </td>
                      <td className="text-right py-3 px-3 text-slate-300">
                        {nearby.yearBuilt || 'N/A'}
                      </td>
                      <td className="text-right py-3 px-3 text-[#00FFFF]">
                        {nearby.distance.toFixed(2)} mi
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
