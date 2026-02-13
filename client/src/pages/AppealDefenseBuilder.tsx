import { useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  FileText,
  Image as ImageIcon,
  BarChart3,
  Sparkles,
  Download,
  Save,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';

/**
 * AppealDefenseBuilder - Canonical Scene for Appeal Defense
 * 
 * Full-screen immersive workflow for building comprehensive appeal defense packages.
 * Follows TerraFusion OS principles: spatial computing, audit-first, "3 Clicks to Value".
 */
export default function AppealDefenseBuilder() {
  const [, setLocation] = useLocation();
  const [appealId, setAppealId] = useState<number | null>(null);
  const [narrativeText, setNarrativeText] = useState('');
  const [isGeneratingNarrative, setIsGeneratingNarrative] = useState(false);

  const { data: appeal } = trpc.appeals.getById.useQuery(
    { id: appealId! },
    { enabled: !!appealId }
  );

  const handleGenerateNarrative = async () => {
    if (!appeal) return;

    setIsGeneratingNarrative(true);
    try {
      // In production, this would call an AI service
      const generatedText = `
APPEAL DEFENSE NARRATIVE

Parcel ID: ${appeal.parcelId}
County: ${appeal.countyName}
Current Assessed Value: $${appeal.currentAssessedValue.toLocaleString()}
Appealed Value: $${appeal.appealedValue.toLocaleString()}

ASSESSMENT METHODOLOGY:
The subject property was valued using the Cost Approach methodology, which is the industry-standard method for properties of this classification. Our assessment is based on:

1. Market Analysis: Comprehensive review of ${appeal.countyName} County market data
2. Comparable Sales: Analysis of 15 comparable properties within 1-mile radius
3. Physical Inspection: On-site verification of property characteristics
4. Adjustment Factors: Application of time and location adjustments per IAAO standards

SUPPORTING EVIDENCE:
- Assessment ratio falls within acceptable COD range (8.4%)
- Median ratio of 0.96 demonstrates assessment equity
- Property characteristics verified through county records
- Market trends support current valuation

CONCLUSION:
The current assessed value of $${appeal.currentAssessedValue.toLocaleString()} represents fair market value and is supported by substantial evidence. The appeal for reduction to $${appeal.appealedValue.toLocaleString()} lacks sufficient justification based on market data.

RECOMMENDATION: Deny appeal and maintain current assessed value.
      `.trim();

      setNarrativeText(generatedText);
      toast.success('Narrative generated successfully!');
    } catch (error) {
      toast.error('Failed to generate narrative');
    } finally {
      setIsGeneratingNarrative(false);
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
            onClick={() => setLocation('/appeals')}
            className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Appeals
          </Button>
          <div className="h-6 w-px bg-white/10" />
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]">
            Appeal Defense Builder
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-white/10"
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-white/10"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>
          <Button
            size="sm"
            className="bg-[var(--color-signal-primary)] hover:bg-[var(--color-signal-primary)]/90"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Package
          </Button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-12 gap-6 p-6 pb-24">
        {/* Left Panel: Appeal Selection & Evidence */}
        <div className="col-span-4 space-y-6">
          {/* Appeal Selector */}
          <Card className="p-6 bg-[var(--color-glass-2)] border-white/10">
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-4">
              Select Appeal
            </h2>
            <Input
              type="number"
              placeholder="Enter Appeal ID..."
              value={appealId || ''}
              onChange={(e) => setAppealId(Number(e.target.value) || null)}
              className="bg-[var(--color-glass-3)] border-white/10"
            />
            {appeal && (
              <div className="mt-4 p-4 rounded-lg bg-[var(--color-glass-3)] border border-white/10">
                <div className="text-sm text-[var(--color-text-tertiary)] mb-1">
                  Parcel ID
                </div>
                <div className="text-[var(--color-text-primary)] font-medium mb-3">
                  {appeal.parcelId}
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-[var(--color-text-tertiary)]">Current</div>
                    <div className="text-[var(--color-text-primary)] font-medium">
                      ${appeal.currentAssessedValue.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-[var(--color-text-tertiary)]">Appealed</div>
                    <div className="text-[var(--color-text-primary)] font-medium">
                      ${appeal.appealedValue.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Evidence Collection */}
          <Card className="p-6 bg-[var(--color-glass-2)] border-white/10">
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-4">
              Evidence Collection
            </h2>
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start border-white/10"
              >
                <FileText className="w-4 h-4 mr-2" />
                Assessment Records
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start border-white/10"
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                Property Photos
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start border-white/10"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Comparable Sales
              </Button>
            </div>
          </Card>

          {/* Comparable Sales Analyzer */}
          <Card className="p-6 bg-[var(--color-glass-2)] border-white/10">
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-4">
              Comparable Sales
            </h2>
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg bg-[var(--color-glass-3)] border border-white/10"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-[var(--color-text-primary)]">
                      Comp #{i}
                    </span>
                    <span className="text-xs text-[var(--color-signal-primary)]">
                      0.{95 + i}mi
                    </span>
                  </div>
                  <div className="text-xs text-[var(--color-text-tertiary)]">
                    Sale Price: ${(250000 + i * 10000).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Center Panel: Narrative Builder */}
        <div className="col-span-8 space-y-6">
          <Card className="p-6 bg-[var(--color-glass-2)] border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
                Defense Narrative
              </h2>
              <Button
                onClick={handleGenerateNarrative}
                disabled={!appeal || isGeneratingNarrative}
                className="bg-gradient-to-r from-[var(--color-signal-primary)] to-[var(--color-signal-secondary)]
                           hover:opacity-90"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {isGeneratingNarrative ? 'Generating...' : 'AI Generate'}
              </Button>
            </div>

            <Textarea
              placeholder="Write your defense narrative here, or use AI to generate one based on the appeal evidence..."
              value={narrativeText}
              onChange={(e) => setNarrativeText(e.target.value)}
              rows={25}
              className="bg-[var(--color-glass-3)] border-white/10 font-mono text-sm"
            />
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4 bg-[var(--color-glass-2)] border-white/10">
              <div className="text-xs text-[var(--color-text-tertiary)] mb-1">
                Word Count
              </div>
              <div className="text-2xl font-bold text-[var(--color-text-primary)]">
                {narrativeText.split(/\s+/).filter(Boolean).length}
              </div>
            </Card>
            <Card className="p-4 bg-[var(--color-glass-2)] border-white/10">
              <div className="text-xs text-[var(--color-text-tertiary)] mb-1">
                Evidence Items
              </div>
              <div className="text-2xl font-bold text-[var(--color-text-primary)]">
                0
              </div>
            </Card>
            <Card className="p-4 bg-[var(--color-glass-2)] border-white/10">
              <div className="text-xs text-[var(--color-text-tertiary)] mb-1">
                Completeness
              </div>
              <div className="text-2xl font-bold text-[var(--color-signal-primary)]">
                {narrativeText.length > 500 ? '85%' : '0%'}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
