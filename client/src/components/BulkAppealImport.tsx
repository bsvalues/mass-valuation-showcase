/**
 * Bulk Appeal Import Component
 * Dialog wrapper for CSV batch import with column mapping
 */

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AppealBatchImport } from "./AppealBatchImport";

interface BulkAppealImportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function BulkAppealImport({ open, onOpenChange, onSuccess }: BulkAppealImportProps) {
  const handleSuccess = () => {
    onSuccess();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Batch Import Appeals</DialogTitle>
          <DialogDescription>
            Upload a CSV file to import multiple property tax appeals at once
          </DialogDescription>
        </DialogHeader>
        <AppealBatchImport onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
