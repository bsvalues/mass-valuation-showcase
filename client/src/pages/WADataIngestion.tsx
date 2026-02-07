import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { VisualDataFlowPipeline, type PipelineStageData } from "@/components/wa-data/VisualDataFlowPipeline";
import { AIFieldMappingCoPilot, type FieldMapping } from "@/components/wa-data/AIFieldMappingCoPilot";
import { CapabilityUnlockDashboard, type Capability } from "@/components/wa-data/CapabilityUnlockDashboard";
import { WAParcelLoader } from "@/components/wa-data/WAParcelLoader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { MapIcon, TrendingUp, FileText, Zap, Shield } from "lucide-react";
import { toast } from "sonner";

export default function WADataIngestion() {
  // Pipeline State
  const [pipelineStages, setPipelineStages] = useState<PipelineStageData[]>([
    {
      id: "upload",
      label: "Upload Data",
      icon: require("lucide-react").Upload,
      status: "completed",
      qualityScore: 98,
      message: "County roll file uploaded successfully",
    },
    {
      id: "validate",
      label: "Validate Structure",
      icon: require("lucide-react").CheckSquare,
      status: "completed",
      qualityScore: 95,
      message: "All required fields detected",
    },
    {
      id: "map",
      label: "Map Fields",
      icon: require("lucide-react").Map,
      status: "active",
      progress: 65,
      estimatedTime: "2 min remaining",
      message: "AI mapping in progress...",
    },
    {
      id: "enrich",
      label: "Enrich Data",
      icon: require("lucide-react").Zap,
      status: "pending",
      message: "Waiting for field mapping",
    },
    {
      id: "activate",
      label: "Activate",
      icon: require("lucide-react").Eye,
      status: "pending",
      message: "Ready to go live",
    },
  ]);

  // Field Mapping State
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([
    {
      sourceField: "PARID",
      targetField: "parcel_id",
      confidence: 98,
      status: "pending",
      sampleValues: ["12345-001", "12345-002", "12345-003"],
      learnedFrom: "King County",
    },
    {
      sourceField: "SITUS_ADDR",
      targetField: "situs_address",
      confidence: 95,
      status: "pending",
      sampleValues: ["123 Main St", "456 Oak Ave", "789 Pine Rd"],
      learnedFrom: "Benton County",
    },
    {
      sourceField: "LAND_VAL",
      targetField: "land_value",
      confidence: 92,
      status: "pending",
      sampleValues: ["125000", "89000", "215000"],
    },
    {
      sourceField: "IMPR_VAL",
      targetField: "improvement_value",
      confidence: 92,
      status: "pending",
      sampleValues: ["285000", "195000", "425000"],
    },
    {
      sourceField: "TOT_VAL",
      targetField: "total_value",
      confidence: 98,
      status: "pending",
      sampleValues: ["410000", "284000", "640000"],
    },
  ]);

  // Capability State
  const [dataLayers, setDataLayers] = useState({
    parcelFabric: true,
    countyRoll: false,
    salesStream: false,
  });

  const capabilities: Capability[] = [
    {
      id: "cockpit_map",
      name: "Quantum Cockpit Map",
      description: "Interactive parcel visualization with clustering",
      icon: MapIcon,
      unlocked: dataLayers.parcelFabric,
      requirements: { parcelFabric: true },
      badge: { label: "Core", variant: "default" },
    },
    {
      id: "comps_selection",
      name: "Comparable Sales",
      description: "AI-powered comparable property finder",
      icon: FileText,
      unlocked: dataLayers.salesStream,
      requirements: { salesStream: true },
      badge: { label: "Analytics", variant: "secondary" },
    },
    {
      id: "ratio_studies",
      name: "Ratio Studies",
      description: "Statistical assessment quality analysis",
      icon: TrendingUp,
      unlocked: dataLayers.countyRoll && dataLayers.salesStream,
      requirements: { countyRoll: true, salesStream: true },
      badge: { label: "Advanced", variant: "outline" },
    },
    {
      id: "model_calibration",
      name: "Model Calibration Studio",
      description: "Fine-tune valuation models with ML",
      icon: Zap,
      unlocked: dataLayers.parcelFabric && dataLayers.countyRoll && dataLayers.salesStream,
      requirements: { parcelFabric: true, countyRoll: true, salesStream: true },
      badge: { label: "Pro", variant: "outline" },
    },
    {
      id: "appeals_support",
      name: "Appeals Support",
      description: "Automated defense documentation",
      icon: Shield,
      unlocked: dataLayers.parcelFabric && dataLayers.countyRoll && dataLayers.salesStream,
      requirements: { parcelFabric: true, countyRoll: true, salesStream: true },
      badge: { label: "Pro", variant: "outline" },
    },
  ];

  const targetFields = [
    { value: "parcel_id", label: "Parcel ID", description: "Unique parcel identifier (APN/PARID)" },
    { value: "situs_address", label: "Situs Address", description: "Property street address" },
    { value: "land_value", label: "Land Value", description: "Assessed land value in dollars" },
    { value: "improvement_value", label: "Improvement Value", description: "Assessed building value" },
    { value: "total_value", label: "Total Value", description: "Total assessed value" },
    { value: "property_class", label: "Property Class", description: "Property classification code" },
    { value: "year_built", label: "Year Built", description: "Construction year" },
    { value: "building_sqft", label: "Building Sq Ft", description: "Building square footage" },
  ];

  const handleConfirmMapping = (sourceField: string, targetField: string) => {
    setFieldMappings((prev) =>
      prev.map((m) => (m.sourceField === sourceField ? { ...m, status: "confirmed" as const } : m))
    );
    toast.success(`Mapped ${sourceField} → ${targetField}`);
  };

  const handleSkipMapping = (sourceField: string) => {
    setFieldMappings((prev) =>
      prev.map((m) => (m.sourceField === sourceField ? { ...m, status: "skipped" as const } : m))
    );
    toast.info(`Skipped ${sourceField}`);
  };

  const handleManualMap = (sourceField: string, targetField: string) => {
    setFieldMappings((prev) =>
      prev.map((m) =>
        m.sourceField === sourceField
          ? { ...m, targetField, status: "manual" as const, confidence: 100 }
          : m
      )
    );
    toast.success(`Manually mapped ${sourceField} → ${targetField}`);
  };

  const handleRollback = (toStage: string) => {
    toast.info(`Rolling back to ${toStage}...`);
  };

  const handleAddData = (layer: "parcelFabric" | "countyRoll" | "salesStream") => {
    toast.info(`Opening ${layer} upload wizard...`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">WA County Data Ingestion</h1>
            <p className="text-muted-foreground mt-1">
              Enhanced user-friendly data pipeline for Washington State counties
            </p>
          </div>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
            Benton County Demo
          </Badge>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="pipeline" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="pipeline">Data Flow Pipeline</TabsTrigger>
            <TabsTrigger value="mapping">AI Field Mapping</TabsTrigger>
            <TabsTrigger value="capabilities">Capability Unlock</TabsTrigger>
          <TabsTrigger value="parcels">Parcel Loader</TabsTrigger>
          </TabsList>

          <TabsContent value="pipeline" className="space-y-6">
            <VisualDataFlowPipeline
              stages={pipelineStages}
              onRollback={handleRollback}
              rollbackEnabled={true}
            />

            <Card className="bg-background/60 backdrop-blur-xl border-primary/20">
              <CardHeader>
                <CardTitle>About the Visual Pipeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  The <strong className="text-foreground">Visual Data Flow Pipeline</strong> provides
                  real-time transparency into your data journey. Each stage shows:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Live progress indicators with estimated time remaining</li>
                  <li>Data quality scores that update as validation runs</li>
                  <li>Rollback timeline showing "undo to any point in the last 30 days"</li>
                  <li>Animated transitions showing data flowing through the system</li>
                </ul>
                <p className="text-xs italic">
                  Philosophy: "Counties are customers, not data engineers"
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mapping" className="space-y-6">
            <AIFieldMappingCoPilot
              mappings={fieldMappings}
              targetFields={targetFields}
              onConfirm={handleConfirmMapping}
              onSkip={handleSkipMapping}
              onManualMap={handleManualMap}
              countyName="Benton County"
            />

            <Card className="bg-background/60 backdrop-blur-xl border-primary/20">
              <CardHeader>
                <CardTitle>About AI Co-Pilot Mapping</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  The <strong className="text-foreground">AI Co-Pilot</strong> makes field mapping
                  conversational and intelligent:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>
                    <strong className="text-foreground">Auto-confidence scoring:</strong> "98% confident
                    this is Land Value" (green checkmark)
                  </li>
                  <li>
                    <strong className="text-foreground">Learn from corrections:</strong> When a county
                    fixes a mapping, save it for all future uploads
                  </li>
                  <li>
                    <strong className="text-foreground">Cross-county learning:</strong> "King County calls
                    this 'SITUS_ADDR', Benton calls it 'PROP_ADDR' - they're the same field"
                  </li>
                </ul>
                <p className="text-xs italic">Result: Zero-touch automation for repeat uploads</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="capabilities" className="space-y-6">
            <CapabilityUnlockDashboard
              capabilities={capabilities}
              dataLayers={dataLayers}
              onAddData={handleAddData}
            />

            <Card className="bg-background/60 backdrop-blur-xl border-primary/20">
              <CardHeader>
                <CardTitle>About Capability Unlocks</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  The <strong className="text-foreground">Capability Unlock Dashboard</strong> turns data
                  ingestion into a progress quest:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>
                    <strong className="text-foreground">Achievement badges:</strong> "🏆 First Parcel Roll
                    Attached", "⚡ Sales Stream Connected"
                  </li>
                  <li>
                    <strong className="text-foreground">Capability preview cards:</strong> Show what
                    features unlock with each data layer (grayed out until active)
                  </li>
                  <li>
                    <strong className="text-foreground">Progress bar:</strong> "You're 60% to Full
                    TerraFusion Power"
                  </li>
                  <li>
                    <strong className="text-foreground">Next steps CTA:</strong> "Add Sales Data to Unlock
                    Ratio Studies" (with time estimate)
                  </li>
                </ul>
                <p className="text-xs italic">
                  Gamification creates dopamine-driven onboarding that counties actually enjoy
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="parcels" className="space-y-6">
            <WAParcelLoader
              onParcelsLoaded={(result) => {
                toast.success(`Loaded ${result.parcelCount} parcels - ready to visualize on map`);
              }}
            />

            <Card className="bg-background/60 backdrop-blur-xl border-primary/20">
              <CardHeader>
                <CardTitle>About WA Parcel Fabric Integration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  The <strong className="text-foreground">WA Parcel Fabric Loader</strong> connects directly to the Washington State Geospatial Portal:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>
                    <strong className="text-foreground">One-click loading:</strong> Select any WA county and load real parcel geometries instantly
                  </li>
                  <li>
                    <strong className="text-foreground">Live data:</strong> Always current with the latest statewide parcel fabric (updated September 2025)
                  </li>
                  <li>
                    <strong className="text-foreground">Complete attributes:</strong> Includes geometry, ownership, assessment values, and property characteristics
                  </li>
                  <li>
                    <strong className="text-foreground">Map-ready:</strong> GeoJSON format with bounds calculation for instant visualization
                  </li>
                </ul>
                <p className="text-xs italic">
                  Eliminates manual parcel data downloads and shapefile conversions
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
