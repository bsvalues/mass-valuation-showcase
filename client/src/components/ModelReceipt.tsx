import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Upload,
  MessageSquare,
  UserCheck,
  RefreshCw,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { format } from 'date-fns';

export type ReceiptAction =
  | 'status_change'
  | 'document_upload'
  | 'comment_added'
  | 'assignment_change'
  | 'resolution_generated';

export interface ModelReceiptData {
  id: string;
  action: ReceiptAction;
  timestamp: Date;
  performedBy: {
    id: number;
    name: string;
  };
  details: {
    before?: any;
    after?: any;
    metadata?: Record<string, any>;
  };
  rollbackable: boolean;
}

interface ModelReceiptProps {
  receipt: ModelReceiptData;
  onRollback?: (receiptId: string) => void;
  onExport?: (receiptId: string, format: 'pdf' | 'json') => void;
}

export function ModelReceipt({ receipt, onRollback, onExport }: ModelReceiptProps) {
  const [showDetails, setShowDetails] = useState(false);

  const getActionIcon = () => {
    switch (receipt.action) {
      case 'status_change':
        return <RefreshCw className="w-5 h-5" />;
      case 'document_upload':
        return <Upload className="w-5 h-5" />;
      case 'comment_added':
        return <MessageSquare className="w-5 h-5" />;
      case 'assignment_change':
        return <UserCheck className="w-5 h-5" />;
      case 'resolution_generated':
        return <FileText className="w-5 h-5" />;
      default:
        return <CheckCircle2 className="w-5 h-5" />;
    }
  };

  const getActionLabel = () => {
    switch (receipt.action) {
      case 'status_change':
        return 'Status Changed';
      case 'document_upload':
        return 'Document Uploaded';
      case 'comment_added':
        return 'Comment Added';
      case 'assignment_change':
        return 'Assignment Changed';
      case 'resolution_generated':
        return 'Resolution Generated';
      default:
        return 'Action Performed';
    }
  };

  const getActionColor = () => {
    switch (receipt.action) {
      case 'status_change':
        return 'text-[var(--color-signal-primary)]';
      case 'document_upload':
        return 'text-[var(--color-signal-info)]';
      case 'comment_added':
        return 'text-[var(--color-signal-secondary)]';
      case 'assignment_change':
        return 'text-[var(--color-signal-warning)]';
      case 'resolution_generated':
        return 'text-[var(--color-signal-success)]';
      default:
        return 'text-[var(--color-text-secondary)]';
    }
  };

  return (
    <Card
      className="p-4 bg-[var(--color-glass-2)] border-white/10
                 hover:border-[var(--color-signal-primary)]/30
                 transition-all duration-[var(--duration-fast)]
                 shadow-[0_2px_10px_rgba(0,0,0,0.1)]"
    >
      {/* Receipt Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-lg bg-[var(--color-glass-3)] ${getActionColor()}`}
          >
            {getActionIcon()}
          </div>
          <div>
            <div className="font-medium text-[var(--color-text-primary)]">
              {getActionLabel()}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Clock className="w-3 h-3 text-[var(--color-text-tertiary)]" />
              <span className="text-xs text-[var(--color-text-tertiary)]">
                {format(receipt.timestamp, 'MMM d, yyyy h:mm a')}
              </span>
            </div>
          </div>
        </div>

        {/* Receipt ID Badge */}
        <div className="px-2 py-1 rounded bg-[var(--color-glass-3)] border border-white/10">
          <span className="text-xs font-mono text-[var(--color-text-tertiary)]">
            #{receipt.id.slice(0, 8)}
          </span>
        </div>
      </div>

      {/* Performed By */}
      <div className="flex items-center gap-2 mb-3 px-2">
        <span className="text-sm text-[var(--color-text-tertiary)]">by</span>
        <span className="text-sm font-medium text-[var(--color-text-primary)]">
          {receipt.performedBy.name}
        </span>
      </div>

      {/* Change Summary */}
      {receipt.details.before && receipt.details.after && (
        <div className="mb-3 p-3 rounded-lg bg-[var(--color-glass-3)] border border-white/10">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-[var(--color-text-tertiary)] mb-1">Before</div>
              <div className="text-sm text-[var(--color-text-secondary)]">
                {typeof receipt.details.before === 'object'
                  ? JSON.stringify(receipt.details.before, null, 2)
                  : receipt.details.before}
              </div>
            </div>
            <div>
              <div className="text-xs text-[var(--color-text-tertiary)] mb-1">After</div>
              <div className="text-sm text-[var(--color-signal-primary)] font-medium">
                {typeof receipt.details.after === 'object'
                  ? JSON.stringify(receipt.details.after, null, 2)
                  : receipt.details.after}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Metadata */}
      {receipt.details.metadata && Object.keys(receipt.details.metadata).length > 0 && (
        <div className="mb-3">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs text-[var(--color-signal-primary)] hover:underline"
          >
            {showDetails ? 'Hide' : 'Show'} Details
          </button>
          {showDetails && (
            <pre className="mt-2 p-2 rounded bg-[var(--color-government-night-base)] text-xs text-[var(--color-text-secondary)] overflow-x-auto">
              {JSON.stringify(receipt.details.metadata, null, 2)}
            </pre>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-3 border-t border-white/10">
        {receipt.rollbackable && onRollback && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRollback(receipt.id)}
            className="border-white/10 text-[var(--color-signal-alert)] hover:bg-[var(--color-signal-alert)]/10"
          >
            <AlertTriangle className="w-3 h-3 mr-1" />
            Rollback
          </Button>
        )}
        {onExport && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onExport(receipt.id, 'pdf')}
              className="border-white/10"
            >
              <Download className="w-3 h-3 mr-1" />
              PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onExport(receipt.id, 'json')}
              className="border-white/10"
            >
              <Download className="w-3 h-3 mr-1" />
              JSON
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}

/**
 * ModelReceiptTimeline - Display receipts in chronological order
 */
interface ModelReceiptTimelineProps {
  receipts: ModelReceiptData[];
  onRollback?: (receiptId: string) => void;
  onExport?: (receiptId: string, format: 'pdf' | 'json') => void;
}

export function ModelReceiptTimeline({
  receipts,
  onRollback,
  onExport,
}: ModelReceiptTimelineProps) {
  const sortedReceipts = [...receipts].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
          Audit Trail ({receipts.length} actions)
        </h3>
      </div>

      {sortedReceipts.length === 0 ? (
        <Card className="p-8 bg-[var(--color-glass-2)] border-white/10 text-center">
          <FileText className="w-12 h-12 mx-auto mb-3 text-[var(--color-text-tertiary)]" />
          <p className="text-[var(--color-text-secondary)]">No audit trail records yet</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {sortedReceipts.map((receipt) => (
            <ModelReceipt
              key={receipt.id}
              receipt={receipt}
              onRollback={onRollback}
              onExport={onExport}
            />
          ))}
        </div>
      )}
    </div>
  );
}
