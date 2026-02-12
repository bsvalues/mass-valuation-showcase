import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { Loader2, CheckCircle2, AlertCircle, Brain, TrendingUp, Target, BarChart3, Calculator } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useState } from "react";

export default function MLTraining() {
  const [isTraining, setIsTraining] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictionResult, setPredictionResult] = useState<number | null>(null);
  
  // Prediction form state
  const [squareFeet, setSquareFeet] = useState<string>('2000');
  const [yearBuilt, setYearBuilt] = useState<string>('2010');
  const [bedrooms, setBedrooms] = useState<string>('3');
  const [propertyType, setPropertyType] = useState<string>('11');
  const [basementSqFt, setBasementSqFt] = useState<string>('0');
  const [acres, setAcres] = useState<string>('0.25');
  
  // Query model status
  const { data: modelStatus, refetch: refetchStatus } = trpc.mlModel.getModelStatus.useQuery();
  
  // Predict mutation
  const predictMutation = trpc.mlModel.predict.useMutation({
    onSuccess: (data) => {
      setIsPredicting(false);
      setPredictionResult(data.predictedValue);
      toast.success(`Predicted value: $${data.predictedValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}`);
    },
    onError: (error) => {
      setIsPredicting(false);
      toast.error(`Prediction failed: ${error.message}`);
    },
  });
  
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
  
  const handlePredict = () => {
    // Validate inputs
    const sqft = parseFloat(squareFeet);
    const year = parseInt(yearBuilt);
    const beds = parseInt(bedrooms);
    const basement = parseFloat(basementSqFt);
    const acresVal = parseFloat(acres);
    
    if (isNaN(sqft) || sqft <= 0) {
      toast.error('Please enter valid square feet');
      return;
    }
    if (isNaN(year) || year < 1800 || year > new Date().getFullYear()) {
      toast.error('Please enter valid year built');
      return;
    }
    if (isNaN(beds) || beds < 0) {
      toast.error('Please enter valid number of bedrooms');
      return;
    }
    
    setIsPredicting(true);
    setPredictionResult(null);
    
    predictMutation.mutate({
      squareFeet: sqft,
      yearBuilt: year,
      bedrooms: beds,
      propertyType,
      basementSqFt: basement,
      acres: acresVal,
    });
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

        {/* Prediction Interface */}
        {isTrained && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calculator className="w-5 h-5 mr-2" />
                Property Valuation Predictor
              </CardTitle>
              <CardDescription>
                Enter property characteristics to get an instant valuation prediction
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="squareFeet">Square Feet *</Label>
                  <Input
                    id="squareFeet"
                    type="number"
                    value={squareFeet}
                    onChange={(e) => setSquareFeet(e.target.value)}
                    placeholder="2000"
                    min="0"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="yearBuilt">Year Built *</Label>
                  <Input
                    id="yearBuilt"
                    type="number"
                    value={yearBuilt}
                    onChange={(e) => setYearBuilt(e.target.value)}
                    placeholder="2010"
                    min="1800"
                    max={new Date().getFullYear()}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bedrooms">Bedrooms *</Label>
                  <Input
                    id="bedrooms"
                    type="number"
                    value={bedrooms}
                    onChange={(e) => setBedrooms(e.target.value)}
                    placeholder="3"
                    min="0"
                    max="20"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="propertyType">Property Type *</Label>
                  <Select value={propertyType} onValueChange={setPropertyType}>
                    <SelectTrigger id="propertyType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="11">Single Family</SelectItem>
                      <SelectItem value="12">Condo</SelectItem>
                      <SelectItem value="13">Townhouse</SelectItem>
                      <SelectItem value="14">Mobile Home</SelectItem>
                      <SelectItem value="18">Multi-Family</SelectItem>
                      <SelectItem value="83">Commercial</SelectItem>
                      <SelectItem value="39">Industrial</SelectItem>
                      <SelectItem value="54">Vacant Land</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="basementSqFt">Basement Sq Ft</Label>
                  <Input
                    id="basementSqFt"
                    type="number"
                    value={basementSqFt}
                    onChange={(e) => setBasementSqFt(e.target.value)}
                    placeholder="0"
                    min="0"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="acres">Lot Size (Acres)</Label>
                  <Input
                    id="acres"
                    type="number"
                    value={acres}
                    onChange={(e) => setAcres(e.target.value)}
                    placeholder="0.25"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t">
                <p className="text-sm text-muted-foreground">* Required fields</p>
                <Button
                  onClick={handlePredict}
                  disabled={isPredicting || !isTrained}
                  size="lg"
                >
                  {isPredicting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Predicting...
                    </>
                  ) : (
                    <>
                      <Calculator className="w-4 h-4 mr-2" />
                      Predict Value
                    </>
                  )}
                </Button>
              </div>
              
              {predictionResult !== null && (
                <div className="p-6 bg-primary/10 rounded-lg border-2 border-primary/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Predicted Market Value</p>
                      <p className="text-4xl font-bold text-primary">
                        ${predictionResult.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                    <CheckCircle2 className="w-12 h-12 text-primary" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-4">
                    Prediction based on Random Forest model trained on {metrics?.training_samples.toLocaleString()} Benton County sales records
                  </p>
                </div>
              )}
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
