import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { Loader2, CheckCircle2, AlertCircle, Brain, TrendingUp, Target, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export default function MLTraining() {
  const [isTraining, setIsTraining] = useState(false);
  
  // Query model status
  const { data: modelStatus, refetch: refetchStatus } = trpc.mlModel.getModelStatus.useQuery();
  
  // Train model mutation
  const trainModel = trpc.mlModel.trainModel.useMutation({
    onSuccess: (data) => {
      setIsTraining(false);
      toast.success("Model trained successfully!");
      refetchStatus();
    },
    onError: (error) => {
      setIsTraining(false);
      toast.error(`Training failed: ${error.message}`);
    },
  });
  
  const handleTrain = () => {
    setIsTraining(true);
    toast.info("Starting model training... This may take several minutes.");
    trainModel.mutate();
  };
  
  const metrics = modelStatus?.metrics;
  const isTrained = modelStatus?.trained || false;
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">ML Model Training</h1>
            <p className="text-muted-foreground mt-1">
              Train Random Forest model on Benton County sales data for automated property valuation
            </p>
          </div>
          <Badge variant={isTrained ? "default" : "secondary"} className="h-8 px-4">
            {isTrained ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Model Trained
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 mr-2" />
                Not Trained
              </>
            )}
          </Badge>
        </div>

        {/* Training Control Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Brain className="w-5 h-5 mr-2" />
              Training Control
            </CardTitle>
            <CardDescription>
              Train the Random Forest Regressor using 72,729 Benton County sales records
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium">Training Dataset</p>
                <p className="text-sm text-muted-foreground">72,729 sales records from Benton County, WA</p>
              </div>
              <Button 
                onClick={handleTrain} 
                disabled={isTraining}
                size="lg"
              >
                {isTraining ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Training...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4 mr-2" />
                    {isTrained ? "Retrain Model" : "Train Model"}
                  </>
                )}
              </Button>
            </div>
            
            {isTraining && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Training in progress...</span>
                  <span className="font-medium">This may take 3-5 minutes</span>
                </div>
                <Progress value={undefined} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Model Metrics */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Target className="w-4 h-4 mr-2 text-blue-500" />
                  Mean Absolute Error
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${metrics.mae.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Average prediction error
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2 text-green-500" />
                  Root Mean Squared Error
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${metrics.rmse.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Prediction variance
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center">
                  <BarChart3 className="w-4 h-4 mr-2 text-purple-500" />
                  R² Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.r2.toFixed(4)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Model accuracy (0-1 scale)
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-amber-500" />
                  Cross-Validation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.cv_mean.toFixed(4)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  ± {metrics.cv_std.toFixed(4)} std dev
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Training Details */}
        {metrics && (
          <Card>
            <CardHeader>
              <CardTitle>Training Details</CardTitle>
              <CardDescription>Model configuration and dataset information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Training Samples</p>
                  <p className="text-2xl font-bold mt-1">{metrics.training_samples.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Test Samples</p>
                  <p className="text-2xl font-bold mt-1">{metrics.test_samples.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Features</p>
                  <p className="text-2xl font-bold mt-1">{metrics.feature_count}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Trained At</p>
                  <p className="text-sm font-medium mt-1">
                    {new Date(metrics.trained_at).toLocaleString()}
                  </p>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">Model Architecture</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Algorithm: Random Forest Regressor</li>
                  <li>• Estimators: 100 decision trees</li>
                  <li>• Max Depth: 20 levels</li>
                  <li>• Min Samples Split: 5</li>
                  <li>• Min Samples Leaf: 2</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Model State */}
        {!isTrained && !isTraining && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Brain className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Model Trained</h3>
              <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
                Train the Random Forest model using Benton County sales data to enable automated property valuation predictions.
              </p>
              <Button onClick={handleTrain} size="lg">
                <Brain className="w-4 h-4 mr-2" />
                Start Training
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
