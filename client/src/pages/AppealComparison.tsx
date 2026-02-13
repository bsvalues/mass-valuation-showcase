import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Scale, TrendingDown, TrendingUp } from "lucide-react";

interface Appeal {
  id: number;
  parcelId: string;
  appealDate: Date;
  currentAssessedValue: number;
  appealedValue: number;
  finalValue: number | null;
  status: string;
  appealReason: string | null;
  resolution: string | null;
  countyName: string | null;
  hearingDate: Date | null;
  createdAt: Date;
}

export default function AppealComparison() {
  const [, setLocation] = useLocation();
  const [selectedAppealIds, setSelectedAppealIds] = useState<number[]>([]);
  
  // Query all appeals for selection
  const { data: appeals = [] } = trpc.appeals.list.useQuery();
  
  // Get selected appeals
  const selectedAppeals = appeals.filter(a => selectedAppealIds.includes(a.id));
  
  const handleAddAppeal = (appealId: number) => {
    if (selectedAppealIds.length < 4 && !selectedAppealIds.includes(appealId)) {
      setSelectedAppealIds([...selectedAppealIds, appealId]);
    }
  };
  
  const handleRemoveAppeal = (appealId: number) => {
    setSelectedAppealIds(selectedAppealIds.filter(id => id !== appealId));
  };
  
  // Calculate comparison metrics
  const calculateMetrics = (appeal: Appeal) => {
    const valueDifference = appeal.currentAssessedValue - appeal.appealedValue;
    const percentageChange = (valueDifference / appeal.currentAssessedValue) * 100;
    const assessmentRatio = appeal.finalValue 
      ? (appeal.finalValue / appeal.currentAssessedValue) 
      : (appeal.appealedValue / appeal.currentAssessedValue);
    
    return {
      valueDifference,
      percentageChange,
      assessmentRatio,
    };
  };
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setLocation("/appeals")}
              className="mb-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Appeals
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Appeal Comparison Tool</h1>
            <p className="text-muted-foreground mt-1">
              Compare up to 4 appeals side-by-side for consistent decision-making
            </p>
          </div>
        </div>
        
        {/* Appeal Selection */}
        {selectedAppealIds.length < 4 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Select Appeals to Compare</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto">
                {appeals
                  .filter(a => !selectedAppealIds.includes(a.id))
                  .slice(0, 20)
                  .map((appeal) => (
                    <Card 
                      key={appeal.id} 
                      className="cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => handleAddAppeal(appeal.id)}
                    >
                      <CardContent className="pt-4 pb-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-sm font-semibold">{appeal.parcelId}</span>
                          <Badge variant="outline" className="text-xs">
                            {appeal.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          ${appeal.currentAssessedValue.toLocaleString()} → ${appeal.appealedValue.toLocaleString()}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Comparison Grid */}
        {selectedAppeals.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {selectedAppeals.map((appeal) => {
              const metrics = calculateMetrics(appeal);
              
              return (
                <Card key={appeal.id} className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 h-6 w-6 p-0"
                    onClick={() => handleRemoveAppeal(appeal.id)}
                  >
                    ×
                  </Button>
                  
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-mono">{appeal.parcelId}</CardTitle>
                    {appeal.countyName && (
                      <p className="text-xs text-muted-foreground">{appeal.countyName}</p>
                    )}
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Status */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Status</p>
                      <Badge variant="outline">{appeal.status}</Badge>
                    </div>
                    
                    {/* Values */}
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Current Value</p>
                        <p className="font-semibold">${appeal.currentAssessedValue.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Appealed Value</p>
                        <p className="font-semibold text-blue-600">${appeal.appealedValue.toLocaleString()}</p>
                      </div>
                      {appeal.finalValue && (
                        <div>
                          <p className="text-xs text-muted-foreground">Final Value</p>
                          <p className="font-semibold text-green-600">${appeal.finalValue.toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Metrics */}
                    <div className="pt-3 border-t space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Value Change</span>
                        <div className="flex items-center gap-1">
                          {metrics.valueDifference > 0 ? (
                            <TrendingDown className="w-3 h-3 text-red-500" />
                          ) : (
                            <TrendingUp className="w-3 h-3 text-green-500" />
                          )}
                          <span className={`text-sm font-medium ${metrics.valueDifference > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {Math.abs(metrics.percentageChange).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Assessment Ratio</span>
                        <div className="flex items-center gap-1">
                          <Scale className="w-3 h-3 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            {metrics.assessmentRatio.toFixed(3)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Appeal Date</span>
                        <span className="text-sm">
                          {new Date(appeal.appealDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    {/* Reason */}
                    {appeal.appealReason && (
                      <div className="pt-3 border-t">
                        <p className="text-xs text-muted-foreground mb-1">Reason</p>
                        <p className="text-xs line-clamp-3">{appeal.appealReason}</p>
                      </div>
                    )}
                    
                    {/* Resolution */}
                    {appeal.resolution && (
                      <div className="pt-3 border-t">
                        <p className="text-xs text-muted-foreground mb-1">Resolution</p>
                        <p className="text-xs line-clamp-3">{appeal.resolution}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
        
        {/* Summary Statistics */}
        {selectedAppeals.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Comparison Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Average Current Value</p>
                  <p className="text-lg font-semibold">
                    ${Math.round(selectedAppeals.reduce((sum, a) => sum + a.currentAssessedValue, 0) / selectedAppeals.length).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Average Appealed Value</p>
                  <p className="text-lg font-semibold">
                    ${Math.round(selectedAppeals.reduce((sum, a) => sum + a.appealedValue, 0) / selectedAppeals.length).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Average Reduction</p>
                  <p className="text-lg font-semibold">
                    {(selectedAppeals.reduce((sum, a) => {
                      const diff = a.currentAssessedValue - a.appealedValue;
                      return sum + (diff / a.currentAssessedValue) * 100;
                    }, 0) / selectedAppeals.length).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Comparing</p>
                  <p className="text-lg font-semibold">{selectedAppeals.length} Appeals</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {selectedAppeals.length === 0 && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <Scale className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Select appeals above to begin comparison</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
