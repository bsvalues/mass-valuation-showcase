import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Clock, AlertCircle, Upload, Map, CheckSquare, Eye, Zap, RotateCcw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type PipelineStage = "upload" | "validate" | "map" | "enrich" | "activate";
export type StageStatus = "pending" | "active" | "completed" | "error";

export interface PipelineStageData {
  id: PipelineStage;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  status: StageStatus;
  progress?: number;
  estimatedTime?: string;
  qualityScore?: number;
  message?: string;
}

interface VisualDataFlowPipelineProps {
  stages: PipelineStageData[];
  onRollback?: (toStage: PipelineStage) => void;
  rollbackEnabled?: boolean;
  className?: string;
}

const stageColors = {
  pending: "bg-muted text-muted-foreground",
  active: "bg-primary text-primary-foreground",
  completed: "bg-green-500 text-white",
  error: "bg-destructive text-destructive-foreground",
};

const stageIcons = {
  upload: Upload,
  validate: CheckSquare,
  map: Map,
  enrich: Zap,
  activate: Eye,
};

export function VisualDataFlowPipeline({
  stages,
  onRollback,
  rollbackEnabled = true,
  className = "",
}: VisualDataFlowPipelineProps) {
  const activeStageIndex = stages.findIndex((s) => s.status === "active");
  const completedStages = stages.filter((s) => s.status === "completed").length;
  const totalProgress = (completedStages / stages.length) * 100;

  return (
    <Card className={`bg-background/60 backdrop-blur-xl border-primary/20 ${className}`}>
      <CardContent className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-foreground">Data Flow Pipeline</h3>
            <p className="text-sm text-muted-foreground">Real-time transparency into your data journey</p>
          </div>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
            {completedStages} / {stages.length} Complete
          </Badge>
        </div>

        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-bold text-foreground">{Math.round(totalProgress)}%</span>
          </div>
          <Progress value={totalProgress} className="h-2" />
        </div>

        {/* Pipeline Stages */}
        <div className="space-y-3">
          {stages.map((stage, index) => {
            const Icon = stage.icon;
            const isActive = stage.status === "active";
            const isCompleted = stage.status === "completed";
            const isError = stage.status === "error";
            const isPending = stage.status === "pending";

            return (
              <motion.div
                key={stage.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                {/* Connection Line */}
                {index < stages.length - 1 && (
                  <div
                    className={`absolute left-6 top-12 w-0.5 h-8 transition-colors duration-500 ${
                      isCompleted ? "bg-green-500" : "bg-border"
                    }`}
                  />
                )}

                <div
                  className={`flex items-start gap-4 p-4 rounded-lg border transition-all duration-300 ${
                    isActive
                      ? "bg-primary/5 border-primary shadow-[0_0_20px_rgba(0,255,238,0.2)]"
                      : isCompleted
                      ? "bg-green-500/5 border-green-500/30"
                      : isError
                      ? "bg-destructive/5 border-destructive/30"
                      : "bg-muted/30 border-border"
                  }`}
                >
                  {/* Stage Icon */}
                  <div
                    className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isCompleted
                        ? "bg-green-500 text-white"
                        : isActive
                        ? "bg-primary text-primary-foreground animate-pulse"
                        : isError
                        ? "bg-destructive text-destructive-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <AnimatePresence mode="wait">
                      {isCompleted ? (
                        <motion.div
                          key="check"
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          exit={{ scale: 0, rotate: 180 }}
                        >
                          <CheckCircle2 className="w-6 h-6" />
                        </motion.div>
                      ) : isError ? (
                        <motion.div
                          key="error"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                        >
                          <AlertCircle className="w-6 h-6" />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="icon"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                        >
                          <Icon className="w-6 h-6" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Stage Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-foreground">{stage.label}</h4>
                      {isActive && stage.estimatedTime && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>{stage.estimatedTime}</span>
                        </div>
                      )}
                    </div>

                    {/* Stage Message */}
                    {stage.message && (
                      <p className="text-sm text-muted-foreground mb-2">{stage.message}</p>
                    )}

                    {/* Active Stage Progress */}
                    {isActive && stage.progress !== undefined && (
                      <div className="space-y-1">
                        <Progress value={stage.progress} className="h-1.5" />
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Processing...</span>
                          <span className="font-medium text-primary">{stage.progress}%</span>
                        </div>
                      </div>
                    )}

                    {/* Quality Score */}
                    {isCompleted && stage.qualityScore !== undefined && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-muted-foreground">Quality Score:</span>
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            stage.qualityScore >= 90
                              ? "bg-green-500/10 text-green-500 border-green-500/30"
                              : stage.qualityScore >= 70
                              ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/30"
                              : "bg-red-500/10 text-red-500 border-red-500/30"
                          }`}
                        >
                          {stage.qualityScore}%
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Rollback Timeline */}
        {rollbackEnabled && completedStages > 0 && onRollback && (
          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Rollback Available</p>
                <p className="text-xs text-muted-foreground">
                  You can undo to any point in the last 30 days
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {
                  const lastCompleted = stages
                    .slice()
                    .reverse()
                    .find((s) => s.status === "completed");
                  if (lastCompleted) {
                    onRollback(lastCompleted.id);
                  }
                }}
              >
                <RotateCcw className="w-4 h-4" />
                Rollback
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
