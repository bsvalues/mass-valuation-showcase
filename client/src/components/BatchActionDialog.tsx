import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TactileButton } from "@/components/terra/TactileButton";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, Clock, RotateCcw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * BatchActionDialog — TerraFusion OS Commitment Confirmation Primitive
 *
 * Keyboard shortcuts:
 *   Enter → confirm action (when dialog is open and not pending)
 *   Esc   → cancel / close (handled natively by Radix Dialog)
 *
 * Focus management:
 *   - Confirm button receives focus on dialog open (autoFocus)
 *   - Tab cycles within dialog (Radix focus trap built-in)
 *
 * States:
 *   idle     → dialog open, confirm/cancel available
 *   pending  → confirm clicked, spinner on confirm button
 *   closed   → dialog dismissed
 */

export type BatchActionType = "approved" | "flagged" | "pending";

interface SeverityBreakdown {
  critical: number;
  warning: number;
}

interface BatchActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: BatchActionType;
  selectedCount: number;
  severity?: SeverityBreakdown;
  isPending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const actionConfig: Record<
  BatchActionType,
  {
    label: string;
    verb: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    borderColor: string;
    bgColor: string;
    description: string;
    confirmVariant: "neon" | "glass";
  }
> = {
  approved: {
    label: "Approve",
    verb: "approve",
    icon: CheckCircle2,
    color: "text-emerald-400",
    borderColor: "border-emerald-500/40",
    bgColor: "bg-emerald-500/10",
    description:
      "Approved properties are marked as reviewed and accepted. This action is logged in the audit trail.",
    confirmVariant: "neon",
  },
  flagged: {
    label: "Flag for Review",
    verb: "flag",
    icon: AlertTriangle,
    color: "text-amber-400",
    borderColor: "border-amber-500/40",
    bgColor: "bg-amber-500/10",
    description:
      "Flagged properties are escalated for manual review. Assessors will be notified.",
    confirmVariant: "glass",
  },
  pending: {
    label: "Reset to Pending",
    verb: "reset",
    icon: Clock,
    color: "text-text-secondary",
    borderColor: "border-glass-border",
    bgColor: "bg-glass-1",
    description:
      "Properties will be returned to pending status for re-evaluation.",
    confirmVariant: "glass",
  },
};

export function BatchActionDialog({
  open,
  onOpenChange,
  action,
  selectedCount,
  severity,
  isPending = false,
  onConfirm,
  onCancel,
}: BatchActionDialogProps) {
  const config = actionConfig[action];
  const Icon = config.icon;
  const confirmRef = React.useRef<HTMLButtonElement>(null);

  // ── Keyboard shortcut: Enter = confirm ──────────────────────────────────────
  // Esc is handled natively by Radix Dialog (onOpenChange(false))
  React.useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if modifier keys are held (avoid conflicts with OS shortcuts)
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === "Enter" && !isPending) {
        // Prevent form submission or other default Enter behaviors
        e.preventDefault();
        e.stopPropagation();
        onConfirm();
      }
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [open, isPending, onConfirm]);

  // ── Auto-focus confirm button when dialog opens ──────────────────────────────
  React.useEffect(() => {
    if (open) {
      // Small delay to let Radix finish its open animation before stealing focus
      const timer = setTimeout(() => {
        confirmRef.current?.focus();
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "bg-glass-1 border backdrop-blur-xl max-w-md",
          config.borderColor
        )}
        aria-describedby="batch-action-description"
        // Prevent Radix from auto-focusing the first focusable element
        // so our useEffect can focus the confirm button instead
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl border mb-2",
              config.bgColor,
              config.borderColor
            )}
          >
            <Icon className={cn("w-6 h-6 flex-shrink-0", config.color)} />
            <div>
              <DialogTitle className="text-text-primary text-lg">
                Confirm Bulk {config.label}
              </DialogTitle>
            </div>
          </div>

          <DialogDescription id="batch-action-description" className="text-text-secondary">
            {config.description}
          </DialogDescription>
        </DialogHeader>

        {/* Count Summary */}
        <div className="space-y-3 py-2">
          <div className="flex items-center justify-between p-3 rounded-lg bg-glass-2 border border-glass-border">
            <span className="text-sm text-text-secondary">Properties selected</span>
            <span className="text-2xl font-bold text-text-primary tabular-nums">
              {selectedCount.toLocaleString()}
            </span>
          </div>

          {/* Severity breakdown — only shown when approving/flagging */}
          {severity && action !== "pending" && (
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-glass-1 border border-red-500/20">
                <span className="text-xs text-text-secondary flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                  Critical
                </span>
                <Badge variant="destructive" className="text-xs">
                  {severity.critical}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-glass-1 border border-amber-500/20">
                <span className="text-xs text-text-secondary flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                  Warning
                </span>
                <Badge className="text-xs bg-amber-500/20 text-amber-400 border-amber-500/30">
                  {severity.warning}
                </Badge>
              </div>
            </div>
          )}

          {/* Audit trail notice */}
          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-glass-1 border border-glass-border">
            <RotateCcw className="w-3.5 h-3.5 text-text-secondary mt-0.5 flex-shrink-0" />
            <p className="text-xs text-text-secondary leading-relaxed">
              This action will be recorded in the Assessment Audit Log. An 8-second undo
              window will appear after confirmation.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          {/* Cancel button — Esc also closes via Radix */}
          <TactileButton
            variant="glass"
            onClick={onCancel}
            disabled={isPending}
            className="flex-1"
            aria-label="Cancel bulk action"
          >
            <span>Cancel</span>
            <kbd className="ml-2 px-1.5 py-0.5 text-xs bg-glass-2 rounded font-mono opacity-60">
              Esc
            </kbd>
          </TactileButton>

          {/* Confirm button — Enter also triggers via keydown listener */}
          <TactileButton
            ref={confirmRef}
            variant={config.confirmVariant}
            commitment
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1"
            aria-label={`Confirm bulk ${config.verb} of ${selectedCount} properties`}
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Icon className="w-4 h-4 mr-2" />
                {config.label} {selectedCount.toLocaleString()}
                <kbd className="ml-2 px-1.5 py-0.5 text-xs bg-black/20 rounded font-mono opacity-70">
                  ↵
                </kbd>
              </>
            )}
          </TactileButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
