import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown, Minus, TrendingUp, Home, DollarSign, Ruler } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { PropertyFeatures, EngineerEdFeatures } from '@/lib/featureEngineering';

interface NeighborhoodComparisonProps {
  property: PropertyFeatures;
  engineeredFeatures: EngineerEdFeatures;
  predictedValue: number;
}

// Mock cluster statistics (in production, fetch from tRPC)
const getClusterStats = (clusterId: number) => {
  // This would come from database aggregation
  const clusterData: Record<number, any> = {
    0: { medianSqft: 2200, medianPrice: 385000, medianPriceSqft: 175, propertyCount: 5849, medianQuality: 3.2, medianAge: 28 },
    1: { medianSqft: 2350, medianPrice: 386500, medianPriceSqft: 165, propertyCount: 5965, medianQuality: 3.4, medianAge: 25 },
    2: { medianSqft: 2100, medianPrice: 375000, medianPriceSqft: 179, propertyCount: 4245, medianQuality: 3.0, medianAge: 32 },
    3: { medianSqft: 2280, medianPrice: 390000, medianPriceSqft: 171, propertyCount: 5798, medianQuality: 3.5, medianAge: 24 },
    4: { medianSqft: 2250, medianPrice: 380000, medianPriceSqft: 169, propertyCount: 5896, medianQuality: 3.3, medianAge: 27 },
  };
  
  return clusterData[clusterId] || clusterData[0];
};

export function NeighborhoodComparison({ property, engineeredFeatures, predictedValue }: NeighborhoodComparisonProps) {
  const clusterId = property.neighborhoodClusterId || 0;
  const clusterStats = getClusterStats(clusterId);
  
  // Calculate property metrics
  const propertySqft = property.squareFeet || 0;
  const propertyPrice = predictedValue;
  const propertyPriceSqft = engineeredFeatures.pricePerSqFt || 0;
  const propertyQuality = engineeredFeatures.qualityScore || 3;
  const propertyAge = engineeredFeatures.propertyAge || 0;
  
  // Calculate differences
  const sqftDiff = ((propertySqft - clusterStats.medianSqft) / clusterStats.medianSqft) * 100;
  const priceDiff = ((propertyPrice - clusterStats.medianPrice) / clusterStats.medianPrice) * 100;
  const priceSqftDiff = ((propertyPriceSqft - clusterStats.medianPriceSqft) / clusterStats.medianPriceSqft) * 100;
  const qualityDiff = ((propertyQuality - clusterStats.medianQuality) / clusterStats.medianQuality) * 100;
  const ageDiff = ((propertyAge - clusterStats.medianAge) / clusterStats.medianAge) * 100;
  
  // Helper to render comparison indicator
  const ComparisonIndicator = ({ diff, reverse = false }: { diff: number; reverse?: boolean }) => {
    const isPositive = reverse ? diff < 0 : diff > 0;
    const isNeutral = Math.abs(diff) < 5;
    
    if (isNeutral) {
      return (
        <Badge variant="outline" className="bg-gray-500/10 text-gray-400 border-gray-500/30">
          <Minus className="w-3 h-3 mr-1" />
          At Average
        </Badge>
      );
    }
    
    if (isPositive) {
      return (
        <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
          <ArrowUp className="w-3 h-3 mr-1" />
          {Math.abs(diff).toFixed(1)}% {reverse ? 'Lower' : 'Higher'}
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30">
        <ArrowDown className="w-3 h-3 mr-1" />
        {Math.abs(diff).toFixed(1)}% {reverse ? 'Higher' : 'Lower'}
      </Badge>
    );
  };
  
  // Comparison data for bar chart
  const comparisonData = [
    {
      metric: 'Square Feet',
      property: propertySqft,
      cluster: clusterStats.medianSqft,
      diff: sqftDiff,
    },
    {
      metric: 'Value',
      property: propertyPrice / 1000,
      cluster: clusterStats.medianPrice / 1000,
      diff: priceDiff,
    },
    {
      metric: 'Price/SqFt',
      property: propertyPriceSqft,
      cluster: clusterStats.medianPriceSqft,
      diff: priceSqftDiff,
    },
    {
      metric: 'Quality',
      property: propertyQuality,
      cluster: clusterStats.medianQuality,
      diff: qualityDiff,
    },
  ];
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-[var(--color-text-primary)]">
            Neighborhood Comparison
          </h3>
          <p className="text-sm text-[var(--color-text-tertiary)] mt-1">
            Compare this property to Cluster #{clusterId} ({clusterStats.propertyCount.toLocaleString()} properties)
          </p>
        </div>
        <Badge className="bg-[var(--color-signal-primary)]/10 text-[var(--color-signal-primary)] border-[var(--color-signal-primary)]/30">
          Cluster #{clusterId}
        </Badge>
      </div>

      {/* Side-by-side comparison cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Property Card */}
        <Card className="bg-[var(--color-glass-2)] border-[var(--color-signal-primary)]/30">
          <CardHeader>
            <CardTitle className="text-[var(--color-signal-primary)] flex items-center gap-2">
              <Home className="w-5 h-5" />
              This Property
            </CardTitle>
            <CardDescription>Current property metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--color-text-tertiary)]">Square Feet</span>
                <span className="text-lg font-bold text-[var(--color-text-primary)]">
                  {propertySqft.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--color-text-tertiary)]">Predicted Value</span>
                <span className="text-lg font-bold text-[var(--color-signal-primary)]">
                  ${propertyPrice.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--color-text-tertiary)]">Price per Sq Ft</span>
                <span className="text-lg font-bold text-[var(--color-text-primary)]">
                  ${propertyPriceSqft.toFixed(0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--color-text-tertiary)]">Quality Score</span>
                <span className="text-lg font-bold text-[var(--color-text-primary)]">
                  {propertyQuality.toFixed(1)} / 5.0
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--color-text-tertiary)]">Property Age</span>
                <span className="text-lg font-bold text-[var(--color-text-primary)]">
                  {propertyAge} years
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cluster Average Card */}
        <Card className="bg-[var(--color-glass-2)] border-white/10">
          <CardHeader>
            <CardTitle className="text-[var(--color-text-primary)] flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Cluster Average
            </CardTitle>
            <CardDescription>Median values for {clusterStats.propertyCount.toLocaleString()} properties</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--color-text-tertiary)]">Square Feet</span>
                <span className="text-lg font-bold text-[var(--color-text-primary)]">
                  {clusterStats.medianSqft.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--color-text-tertiary)]">Median Value</span>
                <span className="text-lg font-bold text-[var(--color-text-primary)]">
                  ${clusterStats.medianPrice.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--color-text-tertiary)]">Price per Sq Ft</span>
                <span className="text-lg font-bold text-[var(--color-text-primary)]">
                  ${clusterStats.medianPriceSqft}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--color-text-tertiary)]">Quality Score</span>
                <span className="text-lg font-bold text-[var(--color-text-primary)]">
                  {clusterStats.medianQuality.toFixed(1)} / 5.0
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--color-text-tertiary)]">Property Age</span>
                <span className="text-lg font-bold text-[var(--color-text-primary)]">
                  {clusterStats.medianAge} years
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comparison Indicators */}
      <Card className="bg-[var(--color-glass-2)] border-white/10">
        <CardHeader>
          <CardTitle className="text-[var(--color-text-primary)]">Performance vs Neighborhood</CardTitle>
          <CardDescription>How this property compares to cluster medians</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-glass-1)]">
              <div className="flex items-center gap-2">
                <Ruler className="w-4 h-4 text-[var(--color-text-tertiary)]" />
                <span className="text-sm text-[var(--color-text-secondary)]">Square Feet</span>
              </div>
              <ComparisonIndicator diff={sqftDiff} />
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-glass-1)]">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[var(--color-text-tertiary)]" />
                <span className="text-sm text-[var(--color-text-secondary)]">Value</span>
              </div>
              <ComparisonIndicator diff={priceDiff} />
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-glass-1)]">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[var(--color-text-tertiary)]" />
                <span className="text-sm text-[var(--color-text-secondary)]">Price/SqFt</span>
              </div>
              <ComparisonIndicator diff={priceSqftDiff} />
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-glass-1)]">
              <div className="flex items-center gap-2">
                <Home className="w-4 h-4 text-[var(--color-text-tertiary)]" />
                <span className="text-sm text-[var(--color-text-secondary)]">Quality</span>
              </div>
              <ComparisonIndicator diff={qualityDiff} />
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-glass-1)]">
              <div className="flex items-center gap-2">
                <Home className="w-4 h-4 text-[var(--color-text-tertiary)]" />
                <span className="text-sm text-[var(--color-text-secondary)]">Age</span>
              </div>
              <ComparisonIndicator diff={ageDiff} reverse={true} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comparison Bar Chart */}
      <Card className="bg-[var(--color-glass-2)] border-white/10">
        <CardHeader>
          <CardTitle className="text-[var(--color-text-primary)]">Visual Comparison</CardTitle>
          <CardDescription>Side-by-side metric comparison</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="metric" 
                stroke="var(--color-text-tertiary)"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="var(--color-text-tertiary)"
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(10,14,26,0.95)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="property" name="This Property" fill="var(--color-signal-primary)" />
              <Bar dataKey="cluster" name="Cluster Average" fill="rgba(255,255,255,0.3)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
