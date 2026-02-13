import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  MapPin,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Download,
} from 'lucide-react';

/**
 * MassAppraisalDashboard - Canonical Scene for Mass Appraisal Monitoring
 * 
 * Full-screen immersive dashboard for monitoring mass appraisal quality,
 * property value distributions, and statistical indicators.
 */
export default function MassAppraisalDashboard() {
  const [, setLocation] = useLocation();
  const [selectedCounty, setSelectedCounty] = useState('all');
  const [selectedYear, setSelectedYear] = useState('2026');

  // Mock data - in production, fetch from tRPC
  const qualityMetrics = {
    medianRatio: 0.96,
    cod: 8.4,
    prd: 1.02,
    totalProperties: 42850,
    recentSales: 1247,
  };

  const countyData = [
    { name: 'King County', properties: 15420, avgValue: 425000, cod: 7.2, status: 'excellent' },
    { name: 'Pierce County', properties: 12350, avgValue: 385000, cod: 8.9, status: 'good' },
    { name: 'Snohomish County', properties: 9840, avgValue: 398000, cod: 9.5, status: 'acceptable' },
    { name: 'Spokane County', properties: 5240, avgValue: 295000, cod: 11.2, status: 'review' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'text-[var(--color-signal-success)]';
      case 'good':
        return 'text-[var(--color-signal-primary)]';
      case 'acceptable':
        return 'text-[var(--color-signal-warning)]';
      case 'review':
        return 'text-[var(--color-signal-alert)]';
      default:
        return 'text-[var(--color-text-secondary)]';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent':
      case 'good':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'acceptable':
      case 'review':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-government-night-base)]">
      {/* Top Navigation Bar */}
      <div
        className="sticky top-14 z-30 h-16 flex items-center justify-between px-6
                   bg-[var(--color-glass-2)] backdrop-blur-xl border-b border-white/10"
      >
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/')}
            className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          <div className="h-6 w-px bg-white/10" />
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]">
            Mass Appraisal Dashboard
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Select value={selectedCounty} onValueChange={setSelectedCounty}>
            <SelectTrigger className="w-40 bg-[var(--color-glass-3)] border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Counties</SelectItem>
              <SelectItem value="king">King County</SelectItem>
              <SelectItem value="pierce">Pierce County</SelectItem>
              <SelectItem value="snohomish">Snohomish County</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-32 bg-[var(--color-glass-3)] border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2026">2026</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
            </SelectContent>
          </Select>

          <Button
            size="sm"
            className="bg-[var(--color-signal-primary)] hover:bg-[var(--color-signal-primary)]/90"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 pb-24 space-y-6">
        {/* Quality Metrics Row */}
        <div className="grid grid-cols-5 gap-4">
          <Card className="p-6 bg-[var(--color-glass-2)] border-white/10">
            <div className="text-xs text-[var(--color-text-tertiary)] mb-2">
              Median Ratio (A/S)
            </div>
            <div className="text-3xl font-bold text-[var(--color-text-primary)] mb-1">
              {qualityMetrics.medianRatio.toFixed(2)}
            </div>
            <div className="flex items-center gap-1 text-xs text-[var(--color-signal-success)]">
              <CheckCircle2 className="w-3 h-3" />
              Target: 0.90-1.10
            </div>
          </Card>

          <Card className="p-6 bg-[var(--color-glass-2)] border-white/10">
            <div className="text-xs text-[var(--color-text-tertiary)] mb-2">
              COD (Uniformity)
            </div>
            <div className="text-3xl font-bold text-[var(--color-text-primary)] mb-1">
              {qualityMetrics.cod.toFixed(1)}%
            </div>
            <div className="flex items-center gap-1 text-xs text-[var(--color-signal-success)]">
              <CheckCircle2 className="w-3 h-3" />
              Excellent (&lt;10%)
            </div>
          </Card>

          <Card className="p-6 bg-[var(--color-glass-2)] border-white/10">
            <div className="text-xs text-[var(--color-text-tertiary)] mb-2">
              PRD (Progressivity)
            </div>
            <div className="text-3xl font-bold text-[var(--color-text-primary)] mb-1">
              {qualityMetrics.prd.toFixed(2)}
            </div>
            <div className="flex items-center gap-1 text-xs text-[var(--color-signal-success)]">
              <CheckCircle2 className="w-3 h-3" />
              Target: 0.98-1.03
            </div>
          </Card>

          <Card className="p-6 bg-[var(--color-glass-2)] border-white/10">
            <div className="text-xs text-[var(--color-text-tertiary)] mb-2">
              Total Properties
            </div>
            <div className="text-3xl font-bold text-[var(--color-text-primary)] mb-1">
              {qualityMetrics.totalProperties.toLocaleString()}
            </div>
            <div className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)]">
              <TrendingUp className="w-3 h-3" />
              +2.4% YoY
            </div>
          </Card>

          <Card className="p-6 bg-[var(--color-glass-2)] border-white/10">
            <div className="text-xs text-[var(--color-text-tertiary)] mb-2">
              Recent Sales
            </div>
            <div className="text-3xl font-bold text-[var(--color-text-primary)] mb-1">
              {qualityMetrics.recentSales.toLocaleString()}
            </div>
            <div className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)]">
              Last 90 days
            </div>
          </Card>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Property Value Heatmap */}
          <div className="col-span-8">
            <Card className="p-6 bg-[var(--color-glass-2)] border-white/10">
              <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-4">
                Property Value Heatmap
              </h2>
              <div
                className="relative w-full h-96 rounded-lg overflow-hidden
                           bg-gradient-to-br from-[var(--color-government-night-elevated)] to-[var(--color-government-night-base)]
                           border border-white/10"
              >
                {/* Placeholder for map - in production, integrate MapLibre GL */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="w-16 h-16 mx-auto mb-4 text-[var(--color-signal-primary)]" />
                    <p className="text-[var(--color-text-secondary)]">
                      Interactive property value heatmap
                    </p>
                    <p className="text-sm text-[var(--color-text-tertiary)] mt-1">
                      Integrate MapLibre GL for production
                    </p>
                  </div>
                </div>

                {/* Legend */}
                <div className="absolute bottom-4 left-4 p-3 rounded-lg bg-[var(--color-glass-3)] backdrop-blur-xl border border-white/10">
                  <div className="text-xs font-medium text-[var(--color-text-primary)] mb-2">
                    Value Range
                  </div>
                  <div className="flex items-center gap-2">
                    {['$0-200k', '$200k-400k', '$400k-600k', '$600k+'].map((range, i) => (
                      <div key={range} className="flex items-center gap-1">
                        <div
                          className="w-4 h-4 rounded"
                          style={{
                            background: `hsl(${180 + i * 30}, 70%, ${50 - i * 10}%)`,
                          }}
                        />
                        <span className="text-xs text-[var(--color-text-tertiary)]">
                          {range}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* County Performance */}
          <div className="col-span-4">
            <Card className="p-6 bg-[var(--color-glass-2)] border-white/10">
              <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-4">
                County Performance
              </h2>
              <div className="space-y-3">
                {countyData.map((county) => (
                  <div
                    key={county.name}
                    className="p-4 rounded-lg bg-[var(--color-glass-3)] border border-white/10
                               hover:border-[var(--color-signal-primary)]/30 transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-[var(--color-text-primary)]">
                        {county.name}
                      </span>
                      <div className={`flex items-center gap-1 ${getStatusColor(county.status)}`}>
                        {getStatusIcon(county.status)}
                        <span className="text-xs capitalize">{county.status}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <div className="text-[var(--color-text-tertiary)]">Properties</div>
                        <div className="text-[var(--color-text-primary)] font-medium">
                          {county.properties.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-[var(--color-text-tertiary)]">Avg Value</div>
                        <div className="text-[var(--color-text-primary)] font-medium">
                          ${(county.avgValue / 1000).toFixed(0)}k
                        </div>
                      </div>
                      <div>
                        <div className="text-[var(--color-text-tertiary)]">COD</div>
                        <div className="text-[var(--color-text-primary)] font-medium">
                          {county.cod.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* Statistical Distribution Chart */}
        <Card className="p-6 bg-[var(--color-glass-2)] border-white/10">
          <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-4">
            Assessment Ratio Distribution
          </h2>
          <div className="h-64 flex items-end justify-around gap-2 px-4">
            {/* Placeholder histogram - in production, use Recharts */}
            {[5, 12, 28, 45, 68, 85, 92, 78, 52, 35, 18, 8].map((height, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-lg bg-gradient-to-t from-[var(--color-signal-primary)] to-[var(--color-signal-secondary)]
                           hover:opacity-80 transition-opacity cursor-pointer"
                style={{ height: `${height}%` }}
                title={`Ratio: ${0.85 + i * 0.05} - Count: ${Math.floor(height * 10)}`}
              />
            ))}
          </div>
          <div className="flex items-center justify-between mt-4 px-4 text-xs text-[var(--color-text-tertiary)]">
            <span>0.85</span>
            <span>0.90</span>
            <span>0.95</span>
            <span>1.00</span>
            <span>1.05</span>
            <span>1.10</span>
            <span>1.15</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
