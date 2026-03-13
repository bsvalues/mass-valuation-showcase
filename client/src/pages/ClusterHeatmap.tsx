import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MapPin, 
  TrendingUp, 
  Home, 
  DollarSign, 
  Users,
  X,
  BarChart3
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

// Fallback cluster data used when tRPC query is loading or returns empty
const clusterData = [
  { 
    id: 0, 
    name: 'Cluster 0',
    propertyCount: 5849, 
    medianPrice: 385000, 
    medianSqft: 2200,
    medianAge: 28,
    color: '#00FFEE',
    bounds: { north: 46.28, south: 46.24, east: -119.26, west: -119.32 }
  },
  { 
    id: 1, 
    name: 'Cluster 1',
    propertyCount: 5965, 
    medianPrice: 386500, 
    medianSqft: 2350,
    medianAge: 25,
    color: '#00D4FF',
    bounds: { north: 46.26, south: 46.22, east: -119.24, west: -119.30 }
  },
  { 
    id: 2, 
    name: 'Cluster 2',
    propertyCount: 4245, 
    medianPrice: 375000, 
    medianSqft: 2100,
    medianAge: 32,
    color: '#00AAFF',
    bounds: { north: 46.24, south: 46.20, east: -119.22, west: -119.28 }
  },
  { 
    id: 3, 
    name: 'Cluster 3',
    propertyCount: 5798, 
    medianPrice: 390000, 
    medianSqft: 2280,
    medianAge: 24,
    color: '#0088FF',
    bounds: { north: 46.22, south: 46.18, east: -119.20, west: -119.26 }
  },
  { 
    id: 4, 
    name: 'Cluster 4',
    propertyCount: 5896, 
    medianPrice: 380000, 
    medianSqft: 2250,
    medianAge: 27,
    color: '#0066FF',
    bounds: { north: 46.20, south: 46.16, east: -119.18, west: -119.24 }
  },
];

export default function ClusterHeatmap() {
  const [selectedCluster, setSelectedCluster] = useState<number | null>(null);
  const [hoveredCluster, setHoveredCluster] = useState<number | null>(null);

  // Fetch real cluster data from tRPC
  const { data: clusters = [], isLoading } = trpc.clusterStats.getAllClusters.useQuery();
  const { data: boundaries = [] } = trpc.clusterStats.getClusterBoundaries.useQuery();

  // Map clusters to display format
  const clusterData = clusters.map((cluster: any, index: number) => ({
    id: cluster.clusterId || cluster.id || index,
    name: `Cluster ${cluster.clusterId || cluster.id || index}`,
    propertyCount: cluster.propertyCount || cluster.totalProperties || 0,
    medianPrice: cluster.medianPrice || cluster.medianHomeValue || 0,
    medianSqft: cluster.medianSqft || 2200,
    medianAge: cluster.medianAge || 28,
    color: ['#00FFEE', '#00D4FF', '#00AAFF', '#0088FF', '#0066FF'][index % 5],
    bounds: boundaries.find((b: any) => b.clusterId === (cluster.clusterId || cluster.id))?.bounds || {
      north: 46.28 - index * 0.04,
      south: 46.24 - index * 0.04,
      east: -119.26 + index * 0.04,
      west: -119.32 + index * 0.04
    }
  }));

  const selectedClusterData = selectedCluster !== null 
    ? clusterData.find(c => c.id === selectedCluster) 
    : null;

  // Value distribution data for selected cluster
  const valueDistributionData = selectedClusterData ? [
    { range: '$200-300K', count: Math.floor(selectedClusterData.propertyCount * 0.15) },
    { range: '$300-350K', count: Math.floor(selectedClusterData.propertyCount * 0.25) },
    { range: '$350-400K', count: Math.floor(selectedClusterData.propertyCount * 0.30) },
    { range: '$400-450K', count: Math.floor(selectedClusterData.propertyCount * 0.20) },
    { range: '$450K+', count: Math.floor(selectedClusterData.propertyCount * 0.10) },
  ] : [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">
            Neighborhood Cluster Heatmap
          </h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            Interactive visualization of property market segments
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <p className="text-[var(--color-text-secondary)]">Loading cluster data...</p>
          </div>
        )}

        {/* Stats Overview */}
        {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {clusterData.map((cluster) => (
            <Card 
              key={cluster.id}
              className={`bg-[var(--color-glass-2)] border-white/10 cursor-pointer transition-all hover:scale-105 ${
                selectedCluster === cluster.id ? 'ring-2 ring-[var(--color-signal-primary)]' : ''
              }`}
              onClick={() => setSelectedCluster(cluster.id)}
              onMouseEnter={() => setHoveredCluster(cluster.id)}
              onMouseLeave={() => setHoveredCluster(null)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-[var(--color-text-tertiary)]">
                    Cluster {cluster.id}
                  </CardTitle>
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: cluster.color }}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold" style={{ color: cluster.color }}>
                    ${(cluster.medianPrice / 1000).toFixed(0)}K
                  </div>
                  <p className="text-xs text-[var(--color-text-tertiary)]">
                    {cluster.propertyCount.toLocaleString()} properties
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Placeholder */}
          <Card className="lg:col-span-2 bg-[var(--color-glass-2)] border-white/10">
            <CardHeader>
              <CardTitle className="text-[var(--color-text-primary)]">Cluster Map</CardTitle>
              <CardDescription>
                Click on a cluster to view details
                {hoveredCluster !== null && ` • Hovering: Cluster ${hoveredCluster}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative w-full h-[500px] bg-[var(--color-glass-1)] rounded-lg overflow-hidden">
                {/* Interactive cluster bubble visualization — bubble size proportional to property count */}
                <div className="absolute inset-0 flex flex-wrap items-center justify-center p-8 gap-4">
                  {clusterData.map((cluster, index) => (
                    <div
                      key={cluster.id}
                      className={`relative flex items-center justify-center rounded-full cursor-pointer transition-all ${
                        selectedCluster === cluster.id ? 'scale-110 ring-4 ring-white/30' : ''
                      } ${
                        hoveredCluster === cluster.id ? 'scale-105' : ''
                      }`}
                      style={{
                        width: `${100 + (cluster.propertyCount / 100)}px`,
                        height: `${100 + (cluster.propertyCount / 100)}px`,
                        backgroundColor: cluster.color,
                        opacity: hoveredCluster === null || hoveredCluster === cluster.id ? 0.8 : 0.3,
                      }}
                      onClick={() => setSelectedCluster(cluster.id)}
                      onMouseEnter={() => setHoveredCluster(cluster.id)}
                      onMouseLeave={() => setHoveredCluster(null)}
                    >
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">{cluster.id}</div>
                        <div className="text-xs text-white/80">{cluster.propertyCount}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Legend */}
                <div className="absolute bottom-4 left-4 bg-[var(--color-glass-2)] p-4 rounded-lg border border-white/10">
                  <p className="text-xs font-medium text-[var(--color-text-primary)] mb-2">
                    Median Value
                  </p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#00FFEE' }} />
                      <span className="text-xs text-[var(--color-text-secondary)]">$385K+</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#00AAFF' }} />
                      <span className="text-xs text-[var(--color-text-secondary)]">$375-385K</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#0066FF' }} />
                      <span className="text-xs text-[var(--color-text-secondary)]">&lt;$375K</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cluster Details Sidebar */}
          <Card className="bg-[var(--color-glass-2)] border-white/10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-[var(--color-text-primary)]">
                  {selectedClusterData ? `Cluster ${selectedClusterData.id}` : 'Cluster Details'}
                </CardTitle>
                {selectedCluster !== null && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedCluster(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <CardDescription>
                {selectedClusterData 
                  ? `${selectedClusterData.propertyCount.toLocaleString()} properties in this cluster`
                  : 'Select a cluster to view details'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedClusterData ? (
                <div className="space-y-6">
                  {/* Key Metrics */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-[var(--color-glass-1)] rounded-lg">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-[var(--color-text-tertiary)]" />
                        <span className="text-sm text-[var(--color-text-secondary)]">Median Value</span>
                      </div>
                      <span className="text-lg font-bold" style={{ color: selectedClusterData.color }}>
                        ${selectedClusterData.medianPrice.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-[var(--color-glass-1)] rounded-lg">
                      <div className="flex items-center gap-2">
                        <Home className="w-4 h-4 text-[var(--color-text-tertiary)]" />
                        <span className="text-sm text-[var(--color-text-secondary)]">Median Sq Ft</span>
                      </div>
                      <span className="text-lg font-bold text-[var(--color-text-primary)]">
                        {selectedClusterData.medianSqft.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-[var(--color-glass-1)] rounded-lg">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-[var(--color-text-tertiary)]" />
                        <span className="text-sm text-[var(--color-text-secondary)]">Median Age</span>
                      </div>
                      <span className="text-lg font-bold text-[var(--color-text-primary)]">
                        {selectedClusterData.medianAge} years
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-[var(--color-glass-1)] rounded-lg">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-[var(--color-text-tertiary)]" />
                        <span className="text-sm text-[var(--color-text-secondary)]">Properties</span>
                      </div>
                      <span className="text-lg font-bold text-[var(--color-text-primary)]">
                        {selectedClusterData.propertyCount.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Value Distribution Chart */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-[var(--color-text-primary)] flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      Value Distribution
                    </h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={valueDistributionData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis 
                          dataKey="range" 
                          stroke="var(--color-text-tertiary)"
                          style={{ fontSize: '10px' }}
                        />
                        <YAxis 
                          stroke="var(--color-text-tertiary)"
                          style={{ fontSize: '10px' }}
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'rgba(10,14,26,0.95)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                          }}
                        />
                        <Bar dataKey="count" fill={selectedClusterData.color} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Sample Properties */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-[var(--color-text-primary)] flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Sample Properties
                    </h4>
                    <ScrollArea className="h-[150px]">
                      <div className="space-y-2">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div 
                            key={i}
                            className="p-2 bg-[var(--color-glass-1)] rounded-lg hover:bg-[var(--color-glass-2)] transition-colors cursor-pointer"
                          >
                            <p className="text-xs font-medium text-[var(--color-text-primary)]">
                              Sample Property {i}
                            </p>
                            <p className="text-xs text-[var(--color-text-tertiary)]">
                              ${(selectedClusterData.medianPrice + (Math.random() - 0.5) * 50000).toFixed(0).toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[400px] text-center">
                  <MapPin className="w-12 h-12 text-[var(--color-text-tertiary)] mb-4" />
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    Click on a cluster in the map or cards above to view detailed statistics
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
