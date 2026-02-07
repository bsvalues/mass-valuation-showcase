import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Check, X, SkipForward, AlertTriangle, TrendingUp, Database } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface FieldMapping {
  sourceField: string;
  targetField: string | null;
  confidence: number;
  status: "pending" | "confirmed" | "skipped" | "manual";
  sampleValues?: string[];
  learnedFrom?: string; // County name that taught us this mapping
}

export interface AIFieldMappingCoPilotProps {
  mappings: FieldMapping[];
  targetFields: { value: string; label: string; description?: string }[];
  onConfirm: (sourceField: string, targetField: string) => void;
  onSkip: (sourceField: string) => void;
  onManualMap: (sourceField: string, targetField: string) => void;
  countyName?: string;
  className?: string;
}

export function AIFieldMappingCoPilot({
  mappings,
  targetFields,
  onConfirm,
  onSkip,
  onManualMap,
  countyName = "Your County",
  className = "",
}: AIFieldMappingCoPilotProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [manualMode, setManualMode] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<string>("");

  const currentMapping = mappings[currentIndex];
  const totalMappings = mappings.length;
  const confirmedCount = mappings.filter((m) => m.status === "confirmed").length;
  const progress = (confirmedCount / totalMappings) * 100;

  const handleConfirm = () => {
    if (currentMapping && currentMapping.targetField) {
      onConfirm(currentMapping.sourceField, currentMapping.targetField);
      moveToNext();
    }
  };

  const handleSkip = () => {
    if (currentMapping) {
      onSkip(currentMapping.sourceField);
      moveToNext();
    }
  };

  const handleManualMap = () => {
    if (currentMapping && selectedTarget) {
      onManualMap(currentMapping.sourceField, selectedTarget);
      setManualMode(false);
      setSelectedTarget("");
      moveToNext();
    }
  };

  const moveToNext = () => {
    if (currentIndex < totalMappings - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return "text-green-500 bg-green-500/10 border-green-500/30";
    if (confidence >= 70) return "text-yellow-500 bg-yellow-500/10 border-yellow-500/30";
    return "text-orange-500 bg-orange-500/10 border-orange-500/30";
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 90) return "High Confidence";
    if (confidence >= 70) return "Medium Confidence";
    return "Low Confidence";
  };

  if (!currentMapping) {
    return (
      <Card className={`bg-background/60 backdrop-blur-xl border-primary/20 ${className}`}>
        <CardContent className="p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
              <Check className="w-8 h-8 text-green-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground mb-2">Mapping Complete!</h3>
              <p className="text-sm text-muted-foreground">
                All fields have been mapped. Ready to proceed to validation.
              </p>
            </div>
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
              {confirmedCount} fields mapped
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-background/60 backdrop-blur-xl border-primary/20 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary animate-pulse" />
            </div>
            <div>
              <CardTitle className="text-lg">AI Field Mapping Co-Pilot</CardTitle>
              <p className="text-sm text-muted-foreground">
                Intelligent field detection for {countyName}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
            {currentIndex + 1} / {totalMappings}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Mapping Progress</span>
            <span className="font-bold text-foreground">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Current Field Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentMapping.sourceField}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {/* Source Field */}
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Database className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Source Column
                    </span>
                  </div>
                  <h4 className="text-lg font-bold text-foreground">{currentMapping.sourceField}</h4>
                </div>
                {currentMapping.learnedFrom && (
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30 text-xs">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Learned from {currentMapping.learnedFrom}
                  </Badge>
                )}
              </div>

              {/* Sample Values */}
              {currentMapping.sampleValues && currentMapping.sampleValues.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Sample Values:</p>
                  <div className="flex flex-wrap gap-2">
                    {currentMapping.sampleValues.slice(0, 3).map((value, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs font-mono">
                        {value}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* AI Suggestion */}
            {!manualMode && currentMapping.targetField && (
              <div className="relative">
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-0.5 bg-primary/30" />
                <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-0.5 bg-primary/30" />
                
                <div className="p-4 rounded-lg bg-primary/5 border-2 border-primary/30 shadow-[0_0_20px_rgba(0,255,238,0.1)]">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span className="text-xs font-medium text-primary uppercase tracking-wide">
                          AI Suggestion
                        </span>
                      </div>
                      <h4 className="text-lg font-bold text-foreground">
                        {targetFields.find((f) => f.value === currentMapping.targetField)?.label ||
                          currentMapping.targetField}
                      </h4>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs ${getConfidenceColor(currentMapping.confidence)}`}
                    >
                      {currentMapping.confidence}% {getConfidenceLabel(currentMapping.confidence)}
                    </Badge>
                  </div>

                  {/* Target Field Description */}
                  {targetFields.find((f) => f.value === currentMapping.targetField)?.description && (
                    <p className="text-sm text-muted-foreground">
                      {targetFields.find((f) => f.value === currentMapping.targetField)?.description}
                    </p>
                  )}

                  {/* Low Confidence Warning */}
                  {currentMapping.confidence < 70 && (
                    <div className="mt-3 flex items-start gap-2 p-2 rounded bg-orange-500/10 border border-orange-500/30">
                      <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-orange-500">
                        Low confidence - please verify this mapping is correct
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Manual Mapping Mode */}
            {manualMode && (
              <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">Select Target Field</span>
                </div>
                <Select value={selectedTarget} onValueChange={setSelectedTarget}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a field..." />
                  </SelectTrigger>
                  <SelectContent>
                    {targetFields.map((field) => (
                      <SelectItem key={field.value} value={field.value}>
                        <div>
                          <div className="font-medium">{field.label}</div>
                          {field.description && (
                            <div className="text-xs text-muted-foreground">{field.description}</div>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              {!manualMode ? (
                <>
                  <Button
                    onClick={handleConfirm}
                    className="flex-1 gap-2 bg-green-500 hover:bg-green-600 text-white"
                    disabled={!currentMapping.targetField}
                  >
                    <Check className="w-4 h-4" />
                    Confirm
                  </Button>
                  <Button
                    onClick={() => setManualMode(true)}
                    variant="outline"
                    className="flex-1 gap-2"
                  >
                    <Database className="w-4 h-4" />
                    Choose Different
                  </Button>
                  <Button onClick={handleSkip} variant="ghost" className="gap-2">
                    <SkipForward className="w-4 h-4" />
                    Skip
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={handleManualMap}
                    className="flex-1 gap-2"
                    disabled={!selectedTarget}
                  >
                    <Check className="w-4 h-4" />
                    Map Field
                  </Button>
                  <Button
                    onClick={() => {
                      setManualMode(false);
                      setSelectedTarget("");
                    }}
                    variant="outline"
                    className="gap-2"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-500">{confirmedCount}</div>
            <div className="text-xs text-muted-foreground">Confirmed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-muted-foreground">
              {mappings.filter((m) => m.status === "skipped").length}
            </div>
            <div className="text-xs text-muted-foreground">Skipped</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{totalMappings - currentIndex - 1}</div>
            <div className="text-xs text-muted-foreground">Remaining</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
