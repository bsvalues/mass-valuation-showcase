import { useState, useMemo } from 'react';
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
  Copy,
  Check,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Scale,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';

/**
 * AppealDefenseBuilder - Canonical Scene for Appeal Defense
 *
 * Full-screen immersive workflow for building comprehensive appeal defense packages.
 * AI Generate button calls trpc.defenseStudio.generateNarrative which uses invokeLLM()
 * to produce a structured IAAO-compliant defense narrative from live DB context.
 */
export default function AppealDefenseBuilder() {
  const [, setLocation] = useLocation();
  const [appealId, setAppealId] = useState<number | null>(null);
  const [narrativeText, setNarrativeText] = useState('');
  const [copied, setCopied] = useState(false);

  // Fetch appeal details for the selected ID
  const { data: appeal, isLoading: appealLoading } = trpc.appeals.getById.useQuery(
    { id: appealId! },
    { enabled: !!appealId }
  );

  // LLM narrative generation mutation
  const generateMutation = trpc.defenseStudio.generateNarrative.useMutation({
    onSuccess: (data) => {
      setNarrativeText(data.narrative);
      toast.success(`Narrative generated — ${data.comparableCount} comparable${data.comparableCount !== 1 ? 's' : ''} used`);
    },
    onError: (err) => {
      toast.error(`Generation failed: ${err.message}`);
    },
  });

  const handleGenerateNarrative = () => {
    if (!appealId) return;
    generateMutation.mutate({ appealId });
  };

  const handleCopy = async () => {
    if (!narrativeText) return;
    await navigator.clipboard.writeText(narrativeText);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  // Completeness score: checks for the 4 required IAAO sections
  const completeness = useMemo(() => {
    if (!narrativeText) return 0;
    const sections = [
      'EXECUTIVE SUMMARY',
      'ASSESSMENT METHODOLOGY',
      'SUPPORTING EVIDENCE',
      'CONCLUSION',
    ];
    const found = sections.filter(s => narrativeText.toUpperCase().includes(s)).length;
    const lengthBonus = narrativeText.length > 800 ? 1 : narrativeText.length > 400 ? 0.5 : 0;
    return Math.min(100, Math.round(((found / sections.length) * 75) + (lengthBonus * 25)));
  }, [narrativeText]);

  const wordCount = narrativeText.split(/\s+/).filter(Boolean).length;

  const valueDiff = appeal
    ? appeal.currentAssessedValue - appeal.appealedValue
    : null;
  const valueDiffPct = appeal && appeal.currentAssessedValue > 0
    ? ((valueDiff! / appeal.currentAssessedValue) * 100).toFixed(1)
    : null;

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
          {generateMutation.isPending && (
            <div className="flex items-center gap-2 text-xs text-[var(--color-signal-primary)]">
              <Loader2 className="w-3 h-3 animate-spin" />
              AI generating narrative…
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-white/10"
            onClick={() => toast.info('Preview coming soon')}
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-white/10"
            onClick={() => toast.info('Save draft coming soon')}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>
          <Button
            size="sm"
            className="bg-[var(--color-signal-primary)] hover:bg-[var(--color-signal-primary)]/90 text-black"
            onClick={() => toast.info('Export package coming soon')}
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
              placeholder="Enter Appeal ID…"
              value={appealId ?? ''}
              onChange={(e) => setAppealId(Number(e.target.value) || null)}
              className="bg-[var(--color-glass-3)] border-white/10"
            />

            {appealLoading && (
              <div className="mt-4 flex items-center gap-2 text-sm text-[var(--color-text-tertiary)]">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading appeal…
              </div>
            )}

            {appeal && !appealLoading && (
              <div className="mt-4 space-y-3">
                <div className="p-4 rounded-lg bg-[var(--color-glass-3)] border border-white/10">
                  <div className="text-xs text-[var(--color-text-tertiary)] mb-1">Parcel ID</div>
                  <div className="text-[var(--color-text-primary)] font-mono text-sm mb-3">
                    {appeal.parcelId}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-[var(--color-text-tertiary)] text-xs">Current Value</div>
                      <div className="text-[var(--color-text-primary)] font-semibold">
                        ${appeal.currentAssessedValue.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-[var(--color-text-tertiary)] text-xs">Requested</div>
                      <div className="text-amber-400 font-semibold">
                        ${appeal.appealedValue.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Value difference indicator */}
                {valueDiff !== null && (
                  <div className="p-3 rounded-lg border"
                       style={{
                         background: valueDiff > 0 ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)',
                         borderColor: valueDiff > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)',
                       }}>
                    <div className="flex items-center gap-2 text-sm">
                      {valueDiff > 0
                        ? <TrendingDown className="w-4 h-4 text-red-400" />
                        : <TrendingUp className="w-4 h-4 text-green-400" />}
                      <span className={valueDiff > 0 ? 'text-red-400' : 'text-green-400'}>
                        {valueDiff > 0 ? '−' : '+'}${Math.abs(valueDiff).toLocaleString()} ({valueDiffPct}% reduction requested)
                      </span>
                    </div>
                  </div>
                )}

                {/* Appeal reason */}
                {appeal.appealReason && (
                  <div className="p-3 rounded-lg bg-[var(--color-glass-3)] border border-white/10">
                    <div className="text-xs text-[var(--color-text-tertiary)] mb-1">Appeal Reason</div>
                    <div className="text-sm text-[var(--color-text-secondary)]">{appeal.appealReason}</div>
                  </div>
                )}

                {/* Status badge */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--color-text-tertiary)]">Status:</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize"
                        style={{
                          background: appeal.status === 'pending' ? 'rgba(245,158,11,0.15)' : 'rgba(0,255,238,0.1)',
                          color: appeal.status === 'pending' ? '#F59E0B' : 'var(--color-signal-primary)',
                        }}>
                    {appeal.status.replace('_', ' ')}
                  </span>
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
                onClick={() => toast.info('Assessment Records coming soon')}
              >
                <FileText className="w-4 h-4 mr-2" />
                Assessment Records
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start border-white/10"
                onClick={() => toast.info('Property Photos coming soon')}
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                Property Photos
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start border-white/10"
                onClick={() => toast.info('Comparable Sales coming soon')}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Comparable Sales
              </Button>
            </div>
          </Card>

          {/* AI Generation Stats — shown after generation */}
          {generateMutation.data && (
            <Card className="p-6 bg-[var(--color-glass-2)] border-white/10">
              <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                <Scale className="w-4 h-4 text-[var(--color-signal-primary)]" />
                Generation Summary
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-tertiary)]">Comparables Used</span>
                  <span className="text-[var(--color-text-primary)] font-semibold">
                    {generateMutation.data.comparableCount}
                  </span>
                </div>
                {generateMutation.data.medianCompPrice && (
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-tertiary)]">Median Comp Price</span>
                    <span className="text-[var(--color-text-primary)] font-semibold">
                      ${generateMutation.data.medianCompPrice.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-tertiary)]">Value Difference</span>
                  <span className="text-red-400 font-semibold">
                    −${generateMutation.data.valueDifference.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-tertiary)]">Reduction Requested</span>
                  <span className="text-amber-400 font-semibold">
                    {generateMutation.data.valueDifferencePct.toFixed(1)}%
                  </span>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Center Panel: Narrative Builder */}
        <div className="col-span-8 space-y-6">
          <Card className="p-6 bg-[var(--color-glass-2)] border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
                Defense Narrative
              </h2>
              <div className="flex items-center gap-2">
                {narrativeText && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/10 text-xs"
                    onClick={handleCopy}
                  >
                    {copied
                      ? <><Check className="w-3 h-3 mr-1 text-green-400" />Copied</>
                      : <><Copy className="w-3 h-3 mr-1" />Copy</>}
                  </Button>
                )}
                <Button
                  onClick={handleGenerateNarrative}
                  disabled={!appealId || generateMutation.isPending}
                  className="bg-gradient-to-r from-[var(--color-signal-primary)] to-[var(--color-signal-secondary)]
                             hover:opacity-90 text-black font-semibold"
                >
                  {generateMutation.isPending
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating…</>
                    : <><Sparkles className="w-4 h-4 mr-2" />AI Generate</>}
                </Button>
              </div>
            </div>

            {!appealId && (
              <div className="flex items-center gap-3 p-4 rounded-lg mb-4"
                   style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <p className="text-sm text-amber-400/80">
                  Enter an Appeal ID in the left panel to enable AI narrative generation.
                </p>
              </div>
            )}

            <Textarea
              placeholder="Write your defense narrative here, or use AI Generate to create one from the appeal's live data…"
              value={narrativeText}
              onChange={(e) => setNarrativeText(e.target.value)}
              rows={28}
              className="bg-[var(--color-glass-3)] border-white/10 font-mono text-sm resize-none"
            />
          </Card>

          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="p-4 bg-[var(--color-glass-2)] border-white/10">
              <div className="text-xs text-[var(--color-text-tertiary)] mb-1">Word Count</div>
              <div className="text-2xl font-bold text-[var(--color-text-primary)]">
                {wordCount.toLocaleString()}
              </div>
              <div className="text-xs text-[var(--color-text-tertiary)] mt-1">
                {wordCount < 150 ? 'Too short' : wordCount < 300 ? 'Adequate' : 'Comprehensive'}
              </div>
            </Card>

            <Card className="p-4 bg-[var(--color-glass-2)] border-white/10">
              <div className="text-xs text-[var(--color-text-tertiary)] mb-1">IAAO Sections</div>
              <div className="text-2xl font-bold text-[var(--color-text-primary)]">
                {narrativeText
                  ? ['EXECUTIVE SUMMARY', 'ASSESSMENT METHODOLOGY', 'SUPPORTING EVIDENCE', 'CONCLUSION']
                      .filter(s => narrativeText.toUpperCase().includes(s)).length
                  : 0}
                <span className="text-base text-[var(--color-text-tertiary)]">/4</span>
              </div>
            </Card>

            <Card className="p-4 bg-[var(--color-glass-2)] border-white/10">
              <div className="text-xs text-[var(--color-text-tertiary)] mb-1">Evidence Items</div>
              <div className="text-2xl font-bold text-[var(--color-text-primary)]">
                {generateMutation.data?.comparableCount ?? 0}
              </div>
              <div className="text-xs text-[var(--color-text-tertiary)] mt-1">Comparables</div>
            </Card>

            <Card className="p-4 border-white/10"
                 style={{
                   background: completeness >= 75
                     ? 'rgba(0,255,238,0.06)'
                     : completeness >= 50
                     ? 'rgba(245,158,11,0.06)'
                     : 'var(--color-glass-2)',
                   borderColor: completeness >= 75
                     ? 'rgba(0,255,238,0.2)'
                     : completeness >= 50
                     ? 'rgba(245,158,11,0.2)'
                     : undefined,
                 }}>
              <div className="text-xs text-[var(--color-text-tertiary)] mb-1">Completeness</div>
              <div className="text-2xl font-bold"
                   style={{ color: completeness >= 75 ? 'var(--color-signal-primary)' : completeness >= 50 ? '#F59E0B' : 'var(--color-text-primary)' }}>
                {completeness}%
              </div>
              <div className="flex items-center gap-1 text-xs mt-1"
                   style={{ color: completeness >= 75 ? 'var(--color-signal-primary)' : '#F59E0B' }}>
                {completeness >= 75
                  ? <><CheckCircle2 className="w-3 h-3" />Hearing-ready</>
                  : <><AlertTriangle className="w-3 h-3" />Needs work</>}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
