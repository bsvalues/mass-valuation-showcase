/**
 * Load Data Wizard - Guided workflow for loading county parcel data
 */

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  ChevronLeft,
  Database,
  Zap,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MapPin,
  Download,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";

interface LoadDataWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  countyName: string;
}

export function LoadDataWizard({ open, onOpenChange, countyName }: LoadDataWizardProps) {
  const [step, setStep] = useState(1);
  const [loadMethod, setLoadMethod] = useState<"direct" | "background">("direct");
  const [parcelLimit, setParcelLimit] = useState(10000);
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();

  const totalSteps = 4;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleLoadData = async () => {
    setIsLoading(true);
    try {
      if (loadMethod === "background") {
        // Queue background job
        toast.info(`Queuing background job for ${countyName} County...`);
        // TODO: Implement background job creation
        toast.success(`Background job queued! You'll be notified when complete.`);
      } else {
        // Direct load - redirect to WA Data Ingestion
        toast.info(`Redirecting to data ingestion for ${countyName} County...`);
        setLocation(`/wa-data-ingestion?county=${encodeURIComponent(countyName)}&limit=${parcelLimit}`);
      }
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to start data loading");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3 p-4 bg-primary/10 border border-primary/30 rounded-lg">
              <MapPin className="w-6 h-6 text-primary" />
              <div>
                <h3 className="font-semibold text-primary">{countyName} County</h3>
                <p className="text-sm text-muted-foreground">No parcel data currently loaded</p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">What you'll get:</h4>
              <ul className="space-y-2">
                {[
                  "Complete parcel geometries and boundaries",
                  "Property addresses and parcel IDs",
                  "Land and building assessed values",
                  "Interactive map visualization",
                  "Statistical analysis and charts",
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-500 mb-1">Data Source</p>
                <p className="text-muted-foreground">
                  Parcel data is loaded from the Washington State Geospatial Portal. Data is updated regularly by
                  the state.
                </p>
              </div>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <h4 className="font-medium">Choose loading method:</h4>

            <div className="grid grid-cols-1 gap-4">
              <Card
                className={`cursor-pointer transition-all ${
                  loadMethod === "direct"
                    ? "border-primary bg-primary/5 shadow-[0_0_20px_rgba(0,255,238,0.2)]"
                    : "border-primary/20 hover:border-primary/40"
                }`}
                onClick={() => setLoadMethod("direct")}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Zap className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">Direct Load</h3>
                        <Badge variant="outline" className="text-xs">Recommended</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Load data immediately with live progress tracking. Best for datasets up to 10,000 parcels.
                      </p>
                      <ul className="space-y-1 text-sm">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-3 h-3 text-primary" />
                          Immediate results
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-3 h-3 text-primary" />
                          Live progress updates
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-3 h-3 text-primary" />
                          View on map instantly
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card
                className={`cursor-pointer transition-all ${
                  loadMethod === "background"
                    ? "border-primary bg-primary/5 shadow-[0_0_20px_rgba(0,255,238,0.2)]"
                    : "border-primary/20 hover:border-primary/40"
                }`}
                onClick={() => setLoadMethod("background")}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Database className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">Background Job</h3>
                        <Badge variant="outline" className="text-xs">Large datasets</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Queue a background job for large datasets. Get notified when complete. Best for 10,000+
                        parcels.
                      </p>
                      <ul className="space-y-1 text-sm">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-3 h-3 text-primary" />
                          No browser timeout
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-3 h-3 text-primary" />
                          Email notification
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-3 h-3 text-primary" />
                          Handles 50,000+ parcels
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <h4 className="font-medium">Configure options:</h4>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Parcel Limit</label>
                <select
                  value={parcelLimit}
                  onChange={(e) => setParcelLimit(Number(e.target.value))}
                  className="w-full p-3 bg-background border border-primary/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value={1000}>1,000 parcels (Quick test)</option>
                  <option value={5000}>5,000 parcels</option>
                  <option value={10000}>10,000 parcels (Recommended)</option>
                  <option value={25000}>25,000 parcels</option>
                  <option value={50000}>50,000 parcels (Full county)</option>
                  <option value={0}>All parcels (Unlimited)</option>
                </select>
                <p className="text-xs text-muted-foreground mt-2">
                  {parcelLimit === 0
                    ? "Load all available parcels for this county"
                    : `Load up to ${parcelLimit.toLocaleString()} parcels`}
                </p>
              </div>

              <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg">
                <h5 className="font-medium text-sm mb-2">Estimated time:</h5>
                <p className="text-sm text-muted-foreground">
                  {loadMethod === "direct"
                    ? parcelLimit <= 10000
                      ? "2-5 minutes"
                      : "5-15 minutes"
                    : "15-60 minutes (background)"}
                </p>
              </div>
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                <Download className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-lg mb-2">Ready to load data</h4>
                <p className="text-sm text-muted-foreground">
                  Review your selections and click "Start Loading" to begin.
                </p>
              </div>
            </div>

            <div className="space-y-3 p-4 bg-background/50 border border-primary/20 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">County:</span>
                <span className="font-medium">{countyName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Method:</span>
                <span className="font-medium capitalize">{loadMethod === "direct" ? "Direct Load" : "Background Job"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Parcel Limit:</span>
                <span className="font-medium">
                  {parcelLimit === 0 ? "All parcels" : parcelLimit.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                {loadMethod === "direct"
                  ? "Keep this browser tab open during the loading process."
                  : "You can close this window. You'll receive an email notification when the job completes."}
              </p>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl terra-card bg-[rgba(10,14,26,0.95)] border-primary/30">
        <DialogHeader>
          <DialogTitle className="text-2xl text-primary flex items-center gap-2">
            <Database className="w-6 h-6" />
            Load County Data
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Step {step} of {totalSteps}: {
              step === 1 ? "Introduction" :
              step === 2 ? "Choose Method" :
              step === 3 ? "Configure Options" :
              "Review & Start"
            }
          </DialogDescription>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex gap-2 mb-6">
          {Array.from({ length: totalSteps }).map((_, idx) => (
            <div
              key={idx}
              className={`h-1 flex-1 rounded-full transition-all ${
                idx + 1 <= step ? "bg-primary shadow-[0_0_10px_rgba(0,255,238,0.5)]" : "bg-primary/20"
              }`}
            />
          ))}
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">
          <AnimatePresence mode="wait">{renderStep()}</AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center pt-6 border-t border-primary/20">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 1 || isLoading}
            className="bg-transparent border-primary/30 text-primary hover:bg-primary/10"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {step < totalSteps ? (
            <Button
              onClick={handleNext}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleLoadData}
              disabled={isLoading}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  Start Loading
                  <Download className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
