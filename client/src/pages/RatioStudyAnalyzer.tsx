import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Calculator,
  Download,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from 'lucide-react';

/**
 * RatioStudyAnalyzer - Canonical Scene for Ratio Study Analysis
 * 
 * Full-screen immersive tool for calculating and analyzing assessment ratios,
 * COD, PRD, and generating compliance reports.
 */
export default function RatioStudyAnalyzer() {
  const [, setLocation] = useLocation();
  const [propertyType, setPropertyType] = useState('residential');
  const [studyYear, setStudyYear] = useState('2026');

  // Mock ratio study data
  const ratioData = {
    sampleSize: 247,
    medianRatio: 0.96,
    meanRatio: 0.97,
    weightedMeanRatio: 0.96,
    cod: 8.4,
    prd: 1.02,
    prb: 0.01,
  };

  const complianceStandards = {
    medianRatio: { min: 0.90, max: 1.10, status: 'pass' },
    cod: { max: 10.0, status: 'pass' },
    prd: { min: 0.98, max: 1.03, status: 'pass' },
  };

  const getComplianceStatus = (metric: string) => {
    const standard = complianceStandards[metric as keyof typeof complianceStandards];
    if (!standard) return 'unknown';
    return standard.status;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle2 className="w-5 h-5 text-[var(--color-signal-success)]" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-[var(--color-signal-warning)]" />;
      case 'fail':
        return <XCircle className="w-5 h-5 text-[var(--color-signal-alert)]" />;
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
            Ratio Study Analyzer
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Select value={propertyType} onValueChange={setPropertyType}>
            <SelectTrigger className="w-40 bg-[var(--color-glass-3)] border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="residential">Residential</SelectItem>
              <SelectItem value="commercial">Commercial</SelectItem>
              <SelectItem value="industrial">Industrial</SelectItem>
              <SelectItem value="agricultural">Agricultural</SelectItem>
            </SelectContent>
          </Select>

          <Select value={studyYear} onValueChange={setStudyYear}>
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
        {/* Study Overview */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="p-6 bg-[var(--color-glass-2)] border-white/10">
            <div className="text-xs text-[var(--color-text-tertiary)] mb-2">
              Sample Size
            </div>
            <div className="text-3xl font-bold text-[var(--color-text-primary)]">
              {ratioData.sampleSize}
            </div>
            <div className="text-xs text-[var(--color-text-secondary)] mt-1">
              properties analyzed
            </div>
          </Card>

          <Card className="p-6 bg-[var(--color-glass-2)] border-white/10">
            <div className="text-xs text-[var(--color-text-tertiary)] mb-2">
              Property Type
            </div>
            <div className="text-2xl font-bold text-[var(--color-text-primary)] capitalize">
              {propertyType}
            </div>
            <div className="text-xs text-[var(--color-text-secondary)] mt-1">
              classification
            </div>
          </Card>

          <Card className="p-6 bg-[var(--color-glass-2)] border-white/10">
            <div className="text-xs text-[var(--color-text-tertiary)] mb-2">
              Study Year
            </div>
            <div className="text-3xl font-bold text-[var(--color-text-primary)]">
              {studyYear}
            </div>
            <div className="text-xs text-[var(--color-text-secondary)] mt-1">
              assessment year
            </div>
          </Card>

          <Card className="p-6 bg-[var(--color-glass-2)] border-white/10">
            <div className="text-xs text-[var(--color-text-tertiary)] mb-2">
              Compliance
            </div>
            <div className="flex items-center gap-2 mt-2">
              <CheckCircle2 className="w-6 h-6 text-[var(--color-signal-success)]" />
              <span className="text-xl font-bold text-[var(--color-signal-success)]">
                PASS
              </span>
            </div>
            <div className="text-xs text-[var(--color-text-secondary)] mt-1">
              IAAO standards
            </div>
          </Card>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left Panel: Calculators */}
          <div className="col-span-4 space-y-6">
            {/* COD Calculator */}
            <Card className="p-6 bg-[var(--color-glass-2)] border-white/10">
              <div className="flex items-center gap-2 mb-4">
                <Calculator className="w-5 h-5 text-[var(--color-signal-primary)]" />
                <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
                  COD Calculator
                </h2>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-[var(--color-text-tertiary)] mb-1 block">
                    Median Ratio
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={ratioData.medianRatio}
                    readOnly
                    className="bg-[var(--color-glass-3)] border-white/10"
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--color-text-tertiary)] mb-1 block">
                    Mean Absolute Deviation
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value="0.081"
                    readOnly
                    className="bg-[var(--color-glass-3)] border-white/10"
                  />
                </div>
                <div className="pt-3 border-t border-white/10">
                  <div className="text-xs text-[var(--color-text-tertiary)] mb-1">
                    Coefficient of Dispersion
                  </div>
                  <div className="text-3xl font-bold text-[var(--color-signal-primary)]">
                    {ratioData.cod.toFixed(1)}%
                  </div>
                  <div className="flex items-center gap-1 mt-2 text-xs text-[var(--color-signal-success)]">
                    <CheckCircle2 className="w-3 h-3" />
                    Excellent uniformity (&lt;10%)
                  </div>
                </div>
              </div>
            </Card>

            {/* PRD Calculator */}
            <Card className="p-6 bg-[var(--color-glass-2)] border-white/10">
              <div className="flex items-center gap-2 mb-4">
                <Calculator className="w-5 h-5 text-[var(--color-signal-secondary)]" />
                <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
                  PRD Calculator
                </h2>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-[var(--color-text-tertiary)] mb-1 block">
                    Mean Ratio
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={ratioData.meanRatio}
                    readOnly
                    className="bg-[var(--color-glass-3)] border-white/10"
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--color-text-tertiary)] mb-1 block">
                    Weighted Mean Ratio
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={ratioData.weightedMeanRatio}
                    readOnly
                    className="bg-[var(--color-glass-3)] border-white/10"
                  />
                </div>
                <div className="pt-3 border-t border-white/10">
                  <div className="text-xs text-[var(--color-text-tertiary)] mb-1">
                    Price-Related Differential
                  </div>
                  <div className="text-3xl font-bold text-[var(--color-signal-secondary)]">
                    {ratioData.prd.toFixed(2)}
                  </div>
                  <div className="flex items-center gap-1 mt-2 text-xs text-[var(--color-signal-success)]">
                    <CheckCircle2 className="w-3 h-3" />
                    Within target (0.98-1.03)
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Center Panel: Compliance Report */}
          <div className="col-span-8 space-y-6">
            <Card className="p-6 bg-[var(--color-glass-2)] border-white/10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
                  IAAO Compliance Report
                </h2>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-white/10"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Generate PDF
                </Button>
              </div>

              <div className="space-y-4">
                {/* Median Ratio */}
                <div className="p-4 rounded-lg bg-[var(--color-glass-3)] border border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-medium text-[var(--color-text-primary)]">
                        Median Ratio (Assessment Level)
                      </div>
                      <div className="text-xs text-[var(--color-text-tertiary)] mt-1">
                        IAAO Standard: 0.90 - 1.10
                      </div>
                    </div>
                    {getStatusIcon(getComplianceStatus('medianRatio'))}
                  </div>
                  <div className="text-2xl font-bold text-[var(--color-text-primary)]">
                    {ratioData.medianRatio.toFixed(2)}
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-[var(--color-government-night-base)] overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[var(--color-signal-primary)] to-[var(--color-signal-success)]"
                      style={{ width: `${(ratioData.medianRatio / 1.10) * 100}%` }}
                    />
                  </div>
                </div>

                {/* COD */}
                <div className="p-4 rounded-lg bg-[var(--color-glass-3)] border border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-medium text-[var(--color-text-primary)]">
                        Coefficient of Dispersion (Uniformity)
                      </div>
                      <div className="text-xs text-[var(--color-text-tertiary)] mt-1">
                        IAAO Standard: &lt;10.0% (Residential)
                      </div>
                    </div>
                    {getStatusIcon(getComplianceStatus('cod'))}
                  </div>
                  <div className="text-2xl font-bold text-[var(--color-text-primary)]">
                    {ratioData.cod.toFixed(1)}%
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-[var(--color-government-night-base)] overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[var(--color-signal-success)] to-[var(--color-signal-primary)]"
                      style={{ width: `${(ratioData.cod / 10.0) * 100}%` }}
                    />
                  </div>
                </div>

                {/* PRD */}
                <div className="p-4 rounded-lg bg-[var(--color-glass-3)] border border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-medium text-[var(--color-text-primary)]">
                        Price-Related Differential (Progressivity)
                      </div>
                      <div className="text-xs text-[var(--color-text-tertiary)] mt-1">
                        IAAO Standard: 0.98 - 1.03
                      </div>
                    </div>
                    {getStatusIcon(getComplianceStatus('prd'))}
                  </div>
                  <div className="text-2xl font-bold text-[var(--color-text-primary)]">
                    {ratioData.prd.toFixed(2)}
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-[var(--color-government-night-base)] overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[var(--color-signal-primary)] to-[var(--color-signal-success)]"
                      style={{ width: `${((ratioData.prd - 0.98) / 0.05) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Summary */}
                <div className="p-6 rounded-lg bg-gradient-to-br from-[var(--color-signal-success)]/10 to-[var(--color-signal-primary)]/10 border border-[var(--color-signal-success)]/20">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-[var(--color-signal-success)] flex-shrink-0 mt-1" />
                    <div>
                      <div className="font-bold text-[var(--color-text-primary)] mb-2">
                        Compliance Status: PASS
                      </div>
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        All assessment quality indicators meet or exceed IAAO standards for {propertyType} properties.
                        The assessment roll demonstrates excellent uniformity (COD: {ratioData.cod.toFixed(1)}%),
                        appropriate level (Median Ratio: {ratioData.medianRatio.toFixed(2)}),
                        and minimal regressivity/progressivity (PRD: {ratioData.prd.toFixed(2)}).
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
