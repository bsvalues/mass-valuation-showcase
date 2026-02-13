import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Search,
  FileText,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

interface AppealResolutionWizardProps {
  open: boolean;
  onClose: () => void;
  preselectedAppealId?: number;
}

type WizardStep = 1 | 2 | 3;

export function AppealResolutionWizard({
  open,
  onClose,
  preselectedAppealId,
}: AppealResolutionWizardProps) {
  const [step, setStep] = useState<WizardStep>(preselectedAppealId ? 2 : 1);
  const [selectedAppealId, setSelectedAppealId] = useState<number | null>(
    preselectedAppealId || null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [customNotes, setCustomNotes] = useState('');
  const [newStatus, setNewStatus] = useState<string>('approved');

  const utils = trpc.useUtils();

  // Queries
  const { data: appeals } = trpc.appeals.list.useQuery();
  const { data: selectedAppeal } = trpc.appeals.getById.useQuery(
    { id: selectedAppealId! },
    { enabled: !!selectedAppealId }
  );
  const { data: documents } = trpc.appeals.getDocuments.useQuery(
    { appealId: selectedAppealId! },
    { enabled: !!selectedAppealId }
  );
  const { data: comments } = trpc.appeals.getComments.useQuery(
    { appealId: selectedAppealId! },
    { enabled: !!selectedAppealId }
  );
  const { data: templates } = trpc.resolutionTemplates.list.useQuery();

  // Mutations
  const updateAppeal = trpc.appeals.update.useMutation({
    onSuccess: () => {
      utils.appeals.list.invalidate();
      utils.appeals.getById.invalidate();
      toast.success('Appeal resolved successfully!');
      onClose();
      resetWizard();
    },
    onError: (error) => {
      toast.error(`Failed to resolve appeal: ${error.message}`);
    },
  });

  const resetWizard = () => {
    setStep(1);
    setSelectedAppealId(null);
    setSearchQuery('');
    setSelectedTemplateId(null);
    setCustomNotes('');
    setNewStatus('approved');
  };

  const filteredAppeals = appeals?.filter(
    (appeal) =>
      appeal.parcelId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appeal.countyName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNext = () => {
    if (step < 3) {
      setStep((step + 1) as WizardStep);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((step - 1) as WizardStep);
    }
  };

  const handleResolve = () => {
    if (!selectedAppealId) return;

    const selectedTemplate = templates?.find((t) => t.id === selectedTemplateId);
    let resolutionText = customNotes;

    if (selectedTemplate && selectedAppeal) {
      // Apply template variables
      resolutionText = selectedTemplate.templateText
        .replace(/\{\{parcelId\}\}/g, selectedAppeal.parcelId)
        .replace(/\{\{county\}\}/g, selectedAppeal.countyName || '')
        .replace(/\{\{currentValue\}\}/g, selectedAppeal.currentAssessedValue.toString())
        .replace(/\{\{requestedValue\}\}/g, selectedAppeal.appealedValue.toString());

      if (customNotes) {
        resolutionText += `\n\nAdditional Notes:\n${customNotes}`;
      }
    }

    updateAppeal.mutate({
      id: selectedAppealId,
      status: newStatus as any,
      resolution: resolutionText,
    });
  };

  useEffect(() => {
    if (preselectedAppealId) {
      setSelectedAppealId(preselectedAppealId);
      setStep(2);
    }
  }, [preselectedAppealId]);

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-y-auto
                   bg-[var(--color-government-night-elevated)] border-white/10"
      >
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold text-[var(--color-text-primary)]">
              Appeal Resolution Wizard
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center gap-2 mt-6">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex-1 flex items-center gap-2">
                <div
                  className={`flex-1 h-1 rounded-full transition-all duration-[var(--duration-normal)]
                    ${
                      s <= step
                        ? 'bg-[var(--color-signal-primary)]'
                        : 'bg-[var(--color-glass-2)]'
                    }`}
                />
                {s < 3 && (
                  <ArrowRight
                    className={`w-4 h-4 ${
                      s < step
                        ? 'text-[var(--color-signal-primary)]'
                        : 'text-[var(--color-text-tertiary)]'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-2">
            <span
              className={`text-sm ${
                step === 1
                  ? 'text-[var(--color-signal-primary)] font-medium'
                  : 'text-[var(--color-text-tertiary)]'
              }`}
            >
              1. Select Appeal
            </span>
            <span
              className={`text-sm ${
                step === 2
                  ? 'text-[var(--color-signal-primary)] font-medium'
                  : 'text-[var(--color-text-tertiary)]'
              }`}
            >
              2. Review Evidence
            </span>
            <span
              className={`text-sm ${
                step === 3
                  ? 'text-[var(--color-signal-primary)] font-medium'
                  : 'text-[var(--color-text-tertiary)]'
              }`}
            >
              3. Generate Decision
            </span>
          </div>
        </DialogHeader>

        <div className="mt-6">
          {/* Step 1: Select Appeal */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-tertiary)]" />
                <Input
                  placeholder="Search by Parcel ID or County..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-[var(--color-glass-2)] border-white/10"
                />
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredAppeals?.map((appeal) => (
                  <Card
                    key={appeal.id}
                    className={`p-4 cursor-pointer transition-all duration-[var(--duration-fast)]
                      ${
                        selectedAppealId === appeal.id
                          ? 'bg-[var(--color-signal-primary)]/20 border-[var(--color-signal-primary)]'
                          : 'bg-[var(--color-glass-2)] border-white/10 hover:border-white/20'
                      }`}
                    onClick={() => setSelectedAppealId(appeal.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-[var(--color-text-primary)]">
                          {appeal.parcelId}
                        </div>
                        <div className="text-sm text-[var(--color-text-secondary)]">
                          {appeal.countyName} County
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-[var(--color-text-tertiary)]">
                          Current: ${appeal.currentAssessedValue.toLocaleString()}
                        </div>
                        <div className="text-sm text-[var(--color-text-tertiary)]">
                          Requested: ${appeal.appealedValue.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Review Evidence */}
          {step === 2 && selectedAppeal && (
            <div className="space-y-6">
              <Card className="p-6 bg-[var(--color-glass-2)] border-white/10">
                <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-4">
                  Appeal Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-[var(--color-text-tertiary)]">
                      Parcel ID
                    </span>
                    <div className="text-[var(--color-text-primary)] font-medium">
                      {selectedAppeal.parcelId}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-[var(--color-text-tertiary)]">County</span>
                    <div className="text-[var(--color-text-primary)] font-medium">
                      {selectedAppeal.countyName}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-[var(--color-text-tertiary)]">
                      Current Value
                    </span>
                    <div className="text-[var(--color-text-primary)] font-medium">
                      ${selectedAppeal.currentAssessedValue.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-[var(--color-text-tertiary)]">
                      Requested Value
                    </span>
                    <div className="text-[var(--color-text-primary)] font-medium">
                      ${selectedAppeal.appealedValue.toLocaleString()}
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-[var(--color-glass-2)] border-white/10">
                <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-4">
                  Supporting Documents ({documents?.length || 0})
                </h3>
                {documents && documents.length > 0 ? (
                  <div className="space-y-2">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--color-glass-3)]"
                      >
                        <FileText className="w-4 h-4 text-[var(--color-text-secondary)]" />
                        <span className="text-sm text-[var(--color-text-primary)]">
                          {doc.fileName}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[var(--color-text-tertiary)]">
                    No documents uploaded
                  </p>
                )}
              </Card>

              <Card className="p-6 bg-[var(--color-glass-2)] border-white/10">
                <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-4">
                  Comments & Notes ({comments?.length || 0})
                </h3>
                {comments && comments.length > 0 ? (
                  <div className="space-y-3">
                    {comments.slice(0, 3).map((comment) => (
                      <div key={comment.id} className="p-3 rounded-lg bg-[var(--color-glass-3)]">
                        <div className="text-sm text-[var(--color-text-primary)]">
                          {comment.content}
                        </div>
                        <div className="text-xs text-[var(--color-text-tertiary)] mt-1">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[var(--color-text-tertiary)]">No comments yet</p>
                )}
              </Card>
            </div>
          )}

          {/* Step 3: Generate Decision */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-[var(--color-text-primary)] mb-2 block">
                  Decision
                </label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="bg-[var(--color-glass-2)] border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved">Approve Appeal</SelectItem>
                    <SelectItem value="denied">Deny Appeal</SelectItem>
                    <SelectItem value="partially_approved">Partially Approve</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-[var(--color-text-primary)] mb-2 block">
                  Resolution Template (Optional)
                </label>
                <Select
                  value={selectedTemplateId?.toString() || ''}
                  onValueChange={(value) => setSelectedTemplateId(Number(value))}
                >
                  <SelectTrigger className="bg-[var(--color-glass-2)] border-white/10">
                    <SelectValue placeholder="Select a template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {templates?.map((template) => (
                      <SelectItem key={template.id} value={template.id.toString()}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-[var(--color-text-primary)] mb-2 block">
                  Additional Notes
                </label>
                <Textarea
                  placeholder="Add any additional notes or customizations..."
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  rows={6}
                  className="bg-[var(--color-glass-2)] border-white/10"
                />
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/10">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 1}
            className="border-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {step < 3 ? (
            <Button
              onClick={handleNext}
              disabled={step === 1 && !selectedAppealId}
              className="bg-[var(--color-signal-primary)] hover:bg-[var(--color-signal-primary)]/90"
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleResolve}
              disabled={updateAppeal.isPending}
              className="bg-[var(--color-signal-success)] hover:bg-[var(--color-signal-success)]/90"
            >
              {updateAppeal.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Resolving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Resolve Appeal
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
