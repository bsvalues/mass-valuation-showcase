/**
 * WA Parcel Loader Component
 * One-click loading of county parcel geometries from WA State Geo Portal
 */

import { useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { useWAParcels } from '@/contexts/WAParcelContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Download, MapPin, Loader2, CheckCircle2, AlertCircle, Map } from 'lucide-react';
import { toast } from 'sonner';
import type { ParcelLoadResult } from '../../../../server/waParcelFabric';

interface WAParcelLoaderProps {
  onParcelsLoaded?: (result: ParcelLoadResult) => void;
}

export function WAParcelLoader({ onParcelsLoaded }: WAParcelLoaderProps) {
  const [selectedCounty, setSelectedCounty] = useState<string>('');
  const [loadResult, setLoadResult] = useState<ParcelLoadResult | null>(null);
  const [, setLocation] = useLocation();
  const { setLoadedParcels } = useWAParcels();

  const { data: counties, isLoading: countiesLoading } = trpc.parcels.getWACounties.useQuery();
  const loadParcelsMutation = trpc.parcels.loadWACountyParcels.useMutation({
    onSuccess: (result) => {
      setLoadResult(result);
      if (result.success) {
        toast.success(`Loaded ${result.parcelCount.toLocaleString()} parcels from ${result.countyName} County`);
        onParcelsLoaded?.(result);
      } else {
        toast.error(result.error || 'Failed to load parcels');
      }
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
      setLoadResult({
        success: false,
        countyName: selectedCounty,
        parcelCount: 0,
        features: [],
        error: error.message,
      });
    },
  });

  const handleLoadParcels = () => {
    if (!selectedCounty) {
      toast.error('Please select a county first');
      return;
    }
    loadParcelsMutation.mutate({ countyName: selectedCounty, limit: 1000 });
  };

  return (
    <Card className="bg-background/60 backdrop-blur-xl border-primary/20 shadow-[0_0_30px_rgba(0,255,238,0.1)]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              WA Parcel Fabric Loader
            </CardTitle>
            <CardDescription className="mt-1">
              Load real county parcel geometries from WA State Geo Portal
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
            Live Data
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* County Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground/80">Select County</label>
          <Select
            value={selectedCounty}
            onValueChange={setSelectedCounty}
            disabled={countiesLoading || loadParcelsMutation.isPending}
          >
            <SelectTrigger className="bg-background/40 border-primary/20">
              <SelectValue placeholder="Choose a WA county..." />
            </SelectTrigger>
            <SelectContent>
              {counties?.map((county) => (
                <SelectItem key={county} value={county}>
                  {county} County
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Load Button */}
        <Button
          onClick={handleLoadParcels}
          disabled={!selectedCounty || loadParcelsMutation.isPending}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_rgba(0,255,238,0.3)]"
        >
          {loadParcelsMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Loading Parcels...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Load Parcels
            </>
          )}
        </Button>

        {/* Load Result */}
        {loadResult && (
          <div
            className={`p-4 rounded-lg border ${
              loadResult.success
                ? 'bg-green-500/10 border-green-500/30'
                : 'bg-red-500/10 border-red-500/30'
            }`}
          >
            <div className="flex items-start gap-3">
              {loadResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
              )}
              <div className="flex-1 space-y-2">
                <p className="font-medium">
                  {loadResult.success ? 'Success!' : 'Load Failed'}
                </p>
                {loadResult.success ? (
                  <div className="text-sm space-y-1 text-foreground/70">
                    <p>
                      <strong>{loadResult.parcelCount.toLocaleString()}</strong> parcels loaded from{' '}
                      <strong>{loadResult.countyName} County</strong>
                    </p>
                    {loadResult.bounds && (
                      <p className="text-xs font-mono">
                        Bounds: [{loadResult.bounds.minLng.toFixed(4)}, {loadResult.bounds.minLat.toFixed(4)}] to [
                        {loadResult.bounds.maxLng.toFixed(4)}, {loadResult.bounds.maxLat.toFixed(4)}]
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-red-400">{loadResult.error}</p>
                )}
              </div>
            </div>
            {loadResult.success && (
              <Button
                onClick={() => {
                  setLoadedParcels({
                    countyName: loadResult.countyName,
                    features: loadResult.features,
                    bounds: loadResult.bounds!,
                    parcelCount: loadResult.parcelCount,
                    loadedAt: new Date(),
                  });
                  setLocation('/map-explorer');
                  toast.success('Opening Map Explorer...');
                }}
                className="w-full mt-3 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30"
              >
                <Map className="w-4 h-4 mr-2" />
                View on Map
              </Button>
            )}
          </div>
        )}

        {/* Info */}
        <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t border-border/50">
          <p>• Data source: Washington State Geospatial Portal</p>
          <p>• Limit: 1,000 parcels per load (configurable)</p>
          <p>• Includes geometry, owner, and assessment data</p>
        </div>
      </CardContent>
    </Card>
  );
}
