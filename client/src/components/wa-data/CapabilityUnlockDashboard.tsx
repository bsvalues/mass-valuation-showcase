import { motion } from "framer-motion";
import { Lock, Unlock, Trophy, Zap, TrendingUp, FileText, Shield, Map as MapIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

export interface Capability {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  unlocked: boolean;
  requirements: {
    parcelFabric?: boolean;
    countyRoll?: boolean;
    salesStream?: boolean;
  };
  badge?: {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  };
}

export interface CapabilityUnlockDashboardProps {
  capabilities: Capability[];
  dataLayers: {
    parcelFabric: boolean;
    countyRoll: boolean;
    salesStream: boolean;
  };
  onAddData?: (layer: "parcelFabric" | "countyRoll" | "salesStream") => void;
  className?: string;
}

const capabilityIcons = {
  cockpit_map: MapIcon,
  ratio_studies: TrendingUp,
  comps_selection: FileText,
  model_calibration: Zap,
  appeals_support: Shield,
};

export function CapabilityUnlockDashboard({
  capabilities,
  dataLayers,
  onAddData,
  className = "",
}: CapabilityUnlockDashboardProps) {
  const unlockedCount = capabilities.filter((c) => c.unlocked).length;
  const totalCount = capabilities.length;
  const progress = (unlockedCount / totalCount) * 100;

  const getNextUnlock = () => {
    const locked = capabilities.find((c) => !c.unlocked);
    if (!locked) return null;

    const missing: string[] = [];
    if (locked.requirements.parcelFabric && !dataLayers.parcelFabric) {
      missing.push("Parcel Fabric");
    }
    if (locked.requirements.countyRoll && !dataLayers.countyRoll) {
      missing.push("County Roll");
    }
    if (locked.requirements.salesStream && !dataLayers.salesStream) {
      missing.push("Sales Stream");
    }

    return { capability: locked, missing };
  };

  const nextUnlock = getNextUnlock();

  return (
    <Card className={`bg-background/60 backdrop-blur-xl border-primary/20 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">TerraFusion Power Unlocked</CardTitle>
              <p className="text-sm text-muted-foreground">
                {unlockedCount} of {totalCount} capabilities active
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className={`${
              progress === 100
                ? "bg-green-500/10 text-green-500 border-green-500/30"
                : "bg-primary/10 text-primary border-primary/30"
            }`}
          >
            {Math.round(progress)}% Complete
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-2">
          <Progress value={progress} className="h-3" />
          {progress === 100 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-sm text-green-500"
            >
              <Trophy className="w-4 h-4" />
              <span className="font-medium">Full TerraFusion Power Achieved!</span>
            </motion.div>
          )}
        </div>

        {/* Next Unlock CTA */}
        {nextUnlock && nextUnlock.missing.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/30"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-foreground mb-1">Next Unlock Available</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Add <span className="font-medium text-primary">{nextUnlock.missing.join(", ")}</span> to
                  unlock <span className="font-medium">{nextUnlock.capability.name}</span>
                </p>
                <div className="flex items-center gap-2">
                  {nextUnlock.missing.includes("Parcel Fabric") && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onAddData?.("parcelFabric")}
                      className="text-xs"
                    >
                      Add Parcel Data
                    </Button>
                  )}
                  {nextUnlock.missing.includes("County Roll") && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onAddData?.("countyRoll")}
                      className="text-xs"
                    >
                      Add Roll Data
                    </Button>
                  )}
                  {nextUnlock.missing.includes("Sales Stream") && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onAddData?.("salesStream")}
                      className="text-xs"
                    >
                      Add Sales Data
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Capability Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {capabilities.map((capability, index) => {
            const Icon = capability.icon;
            const isUnlocked = capability.unlocked;

            return (
              <motion.div
                key={capability.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`relative p-4 rounded-lg border transition-all duration-300 ${
                  isUnlocked
                    ? "bg-green-500/5 border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.1)]"
                    : "bg-muted/30 border-border opacity-60"
                }`}
              >
                {/* Unlock Badge */}
                <div className="absolute -top-2 -right-2">
                  {isUnlocked ? (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shadow-lg"
                    >
                      <Unlock className="w-4 h-4 text-white" />
                    </motion.div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <Lock className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isUnlocked ? "bg-green-500/20" : "bg-muted"
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isUnlocked ? "text-green-500" : "text-muted-foreground"}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={`font-semibold text-sm ${isUnlocked ? "text-foreground" : "text-muted-foreground"}`}>
                        {capability.name}
                      </h4>
                      {capability.badge && isUnlocked && (
                        <Badge variant={capability.badge.variant} className="text-xs">
                          {capability.badge.label}
                        </Badge>
                      )}
                    </div>
                    <p className={`text-xs ${isUnlocked ? "text-muted-foreground" : "text-muted-foreground/60"}`}>
                      {capability.description}
                    </p>

                    {/* Requirements */}
                    {!isUnlocked && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {capability.requirements.parcelFabric && (
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              dataLayers.parcelFabric
                                ? "bg-green-500/10 text-green-500 border-green-500/30"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            Parcels {dataLayers.parcelFabric && "✓"}
                          </Badge>
                        )}
                        {capability.requirements.countyRoll && (
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              dataLayers.countyRoll
                                ? "bg-green-500/10 text-green-500 border-green-500/30"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            Roll {dataLayers.countyRoll && "✓"}
                          </Badge>
                        )}
                        {capability.requirements.salesStream && (
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              dataLayers.salesStream
                                ? "bg-green-500/10 text-green-500 border-green-500/30"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            Sales {dataLayers.salesStream && "✓"}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Achievement Summary */}
        {unlockedCount > 0 && (
          <div className="pt-4 border-t border-border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Trophy className="w-4 h-4 text-primary" />
              <span>
                You've unlocked <span className="font-bold text-primary">{unlockedCount}</span> powerful
                capabilities
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
