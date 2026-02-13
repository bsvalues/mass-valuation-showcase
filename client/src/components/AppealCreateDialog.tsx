import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface AppealCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AppealCreateDialog({ open, onOpenChange, onSuccess }: AppealCreateDialogProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [parcelId, setParcelId] = useState("");
  const [currentValue, setCurrentValue] = useState("");
  const [appealedValue, setAppealedValue] = useState("");
  const [reason, setReason] = useState("");
  const [hearingDate, setHearingDate] = useState<Date | undefined>(undefined);
  const [suggestedDocs, setSuggestedDocs] = useState<string[]>([]);
  
  // Fetch active templates
  const { data: templates = [] } = trpc.templates.list.useQuery();
  
  const createAppeal = trpc.appeals.create.useMutation({
    onSuccess: () => {
      toast.success("Appeal created successfully");
      resetForm();
      onSuccess();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(`Failed to create appeal: ${error.message}`);
    },
  });
  
  // Handle template selection and pre-fill
  const handleTemplateSelect = (templateId: string) => {
    if (!templateId || templateId === "none") {
      setSelectedTemplateId(null);
      setReason("");
      setSuggestedDocs([]);
      return;
    }
    
    const template = templates.find(t => t.id === parseInt(templateId));
    if (template) {
      setSelectedTemplateId(template.id);
      if (template.defaultAppealReason) {
        setReason(template.defaultAppealReason);
      }
      if (template.suggestedDocuments) {
        try {
          const docs = JSON.parse(template.suggestedDocuments);
          setSuggestedDocs(Array.isArray(docs) ? docs : []);
        } catch (e) {
          setSuggestedDocs([]);
        }
      }
      toast.success(`Template "${template.name}" applied`);
    }
  };
  
  const resetForm = () => {
    setSelectedTemplateId(null);
    setParcelId("");
    setCurrentValue("");
    setAppealedValue("");
    setReason("");
    setHearingDate(undefined);
    setSuggestedDocs([]);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!parcelId.trim()) {
      toast.error("Parcel ID is required");
      return;
    }
    
    const currentVal = parseFloat(currentValue);
    const appealedVal = parseFloat(appealedValue);
    
    if (isNaN(currentVal) || currentVal <= 0) {
      toast.error("Current assessed value must be a positive number");
      return;
    }
    
    if (isNaN(appealedVal) || appealedVal <= 0) {
      toast.error("Appealed value must be a positive number");
      return;
    }
    
    if (appealedVal >= currentVal) {
      toast.error("Appealed value must be less than current assessed value");
      return;
    }
    
    createAppeal.mutate({
      parcelId: parcelId.trim(),
      appealDate: new Date().toISOString(),
      currentAssessedValue: currentVal,
      appealedValue: appealedVal,
      appealReason: reason.trim() || undefined,
      countyName: "Benton County",
    });
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Appeal</DialogTitle>
          <DialogDescription>
            Submit a new property tax appeal with parcel details and requested valuation.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Template Selector */}
          <div className="space-y-2">
            <Label htmlFor="template">Appeal Template (Optional)</Label>
            <select
              id="template"
              className="w-full px-3 py-2 border rounded-md text-sm bg-background"
              value={selectedTemplateId || "none"}
              onChange={(e) => handleTemplateSelect(e.target.value)}
            >
              <option value="none">No Template - Start from scratch</option>
              {templates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.name} ({template.category})
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Select a template to pre-fill appeal reason and suggested documents
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="parcelId">Parcel ID *</Label>
            <Input
              id="parcelId"
              placeholder="e.g., 123-456-789"
              value={parcelId}
              onChange={(e) => setParcelId(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Enter the unique parcel identifier
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currentValue">Current Assessed Value *</Label>
              <Input
                id="currentValue"
                type="number"
                placeholder="250000"
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                required
                min="0"
                step="1000"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="appealedValue">Appealed Value *</Label>
              <Input
                id="appealedValue"
                type="number"
                placeholder="200000"
                value={appealedValue}
                onChange={(e) => setAppealedValue(e.target.value)}
                required
                min="0"
                step="1000"
              />
            </div>
          </div>
          
          {currentValue && appealedValue && (
            <div className="p-3 bg-muted rounded-lg text-sm">
              <p className="text-muted-foreground">
                Requested reduction: <span className="font-semibold text-foreground">
                  ${(parseFloat(currentValue) - parseFloat(appealedValue)).toLocaleString()}
                </span> ({((1 - parseFloat(appealedValue) / parseFloat(currentValue)) * 100).toFixed(1)}%)
              </p>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="reason">Appeal Reason</Label>
            <Textarea
              id="reason"
              placeholder="Describe the reason for this appeal (e.g., comparable sales analysis, property condition issues, assessment errors)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
            />
            {suggestedDocs.length > 0 && (
              <div className="mt-2 p-3 bg-muted/50 rounded-md">
                <p className="text-sm font-medium mb-2">Suggested Documentation:</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {suggestedDocs.map((doc, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>{doc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <Label>Hearing Date (Optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !hearingDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {hearingDate ? format(hearingDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={hearingDate}
                  onSelect={setHearingDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
              disabled={createAppeal.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createAppeal.isPending}>
              {createAppeal.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Appeal
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
