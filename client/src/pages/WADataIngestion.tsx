import { useState } from "react";
import { BentoCard, BentoGrid } from "@/components/terra/BentoCard";
import { TactileButton } from "@/components/terra/TactileButton";
import { LiquidPanel } from "@/components/terra/LiquidPanel";
import { VisualDataFlowPipeline, type PipelineStageData } from "@/components/wa-data/VisualDataFlowPipeline";
import { AIFieldMappingCoPilot, type FieldMapping } from "@/components/wa-data/AIFieldMappingCoPilot";
import { CapabilityUnlockDashboard, type Capability } from "@/components/wa-data/CapabilityUnlockDashboard";
import { WAParcelLoader } from "@/components/wa-data/WAParcelLoader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { MapIcon, TrendingUp, FileText, Zap, Shield, Upload, CheckSquare, Map, Eye, Database, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

/**
 * WA Data Ingestion - TerraFusion Canonical Scene
 * 
 * Design Principles Applied:
 * - Bento Grid for capability cards
 * - LiquidPanel for pipeline visualization
 * - TactileButton for activation actions
 * - Glass materials for data layers
 */
export default function WADataIngestion() {
  // Pipeline State
  const [pipelineStages, setPipelineStages] = useState<PipelineStageData[]>([
    {
      id: "upload",
      label: "Upload Data",
      icon: Upload,
      status: "completed",
      qualityScore: 98,
      message: "County roll file uploaded successfully",
    },
    {
      id: "validate",
      label: "Validate Structure",
      icon: CheckSquare,
      status: "completed",
      qualityScore: 95,
      message: "All required fields detected",
    },
    {
      id: "map",
      label: "Map Fields",
      icon: Map,
      status: "active",
      progress: 65,
      estimatedTime: "2 min remaining",
      message: "AI mapping in progress...",
    },
    {
      id: "enrich",
      label: "Enrich Data",
      icon: Zap,
      status: "pending",
      message: "Waiting for field mapping",
    },
    {
      id: "activate",
      label: "Activate",
      icon: Eye,
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
      status: "confirmed",
      sampleValues: ["12345-001", "12345-002", "12345-003"],
      learnedFrom: "King County",
    },
    {
      sourceField: "SITUS_ADDR",
      targetField: "situs_address",
      confidence: 95,
      status: "confirmed",
      sampleValues: ["123 Main St", "456 Oak Ave", "789 Pine Rd"],
      learnedFrom: "Benton County",
    },
    {
      sourceField: "LAND_VAL",
      targetField: "land_value",
      confidence: 92,
      status: "confirmed",
      sampleValues: ["125000", "89000", "215000"],
    },
    {
      sourceField: "IMPR_VAL",
      targetField: "improvement_value",
      confidence: 92,
      status: "confirmed",
      sampleValues: ["285000", "195000", "425000"],
    },
    {
      sourceField: "TOT_VAL",
      targetField: "total_value",
      confidence: 98,
      status: "confirmed",
      sampleValues: ["410000", "284000", "640000"],
    },
  ]);

  // Capability State
  const [dataLayers, setDataLayers] = useState({
    parcelFabric: true,
    countyRoll: true,
    salesStream: true,
  });

  const [capabilities, setCapabilities] = useState<Capability[]>([
    {
      id: "mass-appraisal",
      name: "Mass Appraisal Models",
      icon: TrendingUp,
      unlocked: true,
      requirements: { parcelFabric: true, countyRoll: true, salesStream: true },
      description: "Run CAMA models for property valuation",
    },
    {
      id: "equity-analysis",
      name: "Equity Analysis",
      icon: Shield,
      unlocked: true,
      requirements: { parcelFabric: true, salesStream: true },
      description: "COD, PRD, and ratio studies",
    },
    {
      id: "spatial-analytics",
      name: "Spatial Analytics",
      icon: MapIcon,
      unlocked: true,
      requirements: { parcelFabric: true },
      description: "Geographic market analysis",
    },
    {
      id: "appeal-prediction",
      name: "Appeal Prediction",
      icon: FileText,
      unlocked: true,
      requirements: { parcelFabric: true, salesStream: true, countyRoll: true },
      description: "AI-powered appeal risk scoring",
    },
  ]);

  const handleConfirmMapping = (sourceField: string, targetField: string) => {
    setFieldMappings(fieldMappings.map(m =>
      m.sourceField === sourceField ? { ...m, status: "confirmed" as const, targetField } : m
    ));
    toast.success(`Confirmed mapping for ${sourceField}`);
  };

  const handleSkipMapping = (sourceField: string) => {
    setFieldMappings(fieldMappings.map(m =>
      m.sourceField === sourceField ? { ...m, status: "skipped" as const } : m
    ));
    toast.info(`Skipped mapping for ${sourceField}`);
  };

  const handleManualMapping = (sourceField: string, targetField: string) => {
    setFieldMappings(fieldMappings.map(m =>
      m.sourceField === sourceField ? { ...m, status: "manual" as const, targetField } : m
    ));
    toast.success(`Manual mapping set for ${sourceField}`);
  };

  const handleActivateData = () => {
    toast.success("Data activation initiated! Washington County 2026 roll is now live.");
    setPipelineStages(pipelineStages.map(s =>
      s.id === "activate" ? { ...s, status: "completed" as const } : s
    ));
  };

  const approvedCount = fieldMappings.filter(m => m.status === "confirmed").length;
  const totalMappings = fieldMappings.length;
  const unlockedCapabilities = capabilities.length;

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div>
        <h1 className="text-4xl font-bold text-text-primary mb-2">
          Washington County Data Ingestion
        </h1>
        <p className="text-lg text-text-secondary">
          2026 Assessment Roll · 27,753 parcels · AI-powered field mapping
        </p>
      </div>

      {/* Stats Bento Grid */}
      <BentoGrid>
        <BentoCard
          title="Data Quality"
          icon={<CheckCircle2 className="w-5 h-5 text-chart-4" />}
          span="1"
        >
          <div className="text-4xl font-bold text-chart-4">98.4%</div>
          <div className="text-sm text-text-secondary mt-1">Pass rate</div>
        </BentoCard>

        <BentoCard
          title="Field Mappings"
          icon={<Map className="w-5 h-5" />}
          span="1"
        >
          <div className="text-4xl font-bold text-text-primary">{approvedCount}/{totalMappings}</div>
          <div className="text-sm text-text-secondary mt-1">Approved mappings</div>
        </BentoCard>

        <BentoCard
          title="Capabilities"
          icon={<Zap className="w-5 h-5 text-signal-primary" />}
          span="1"
        >
          <div className="text-4xl font-bold text-signal-primary">{unlockedCapabilities}</div>
          <div className="text-sm text-text-secondary mt-1">Features unlocked</div>
        </BentoCard>

        <BentoCard
          title="Total Parcels"
          icon={<Database className="w-5 h-5" />}
          span="1"
        >
          <div className="text-4xl font-bold text-text-primary">27,753</div>
          <div className="text-sm text-text-secondary mt-1">Ready to ingest</div>
        </BentoCard>
      </BentoGrid>

      {/* Pipeline Visualization */}
      <LiquidPanel intensity={2} className="p-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Data Flow Pipeline</h3>
        <VisualDataFlowPipeline stages={pipelineStages} />
      </LiquidPanel>

      {/* Tabs for Different Stages */}
      <Tabs defaultValue="mapping" className="space-y-6">
        <TabsList className="bg-glass-1 border border-glass-border">
          <TabsTrigger value="mapping">Field Mapping</TabsTrigger>
          <TabsTrigger value="capabilities">Capabilities</TabsTrigger>
          <TabsTrigger value="loader">Parcel Loader</TabsTrigger>
        </TabsList>

        {/* Field Mapping Tab */}
        <TabsContent value="mapping" className="space-y-4">
          <LiquidPanel intensity={1} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-text-primary">AI Field Mapping Co-Pilot</h3>
                <p className="text-sm text-text-secondary mt-1">
                  Review and approve AI-suggested field mappings
                </p>
              </div>
              <Badge variant="outline" className="text-signal-primary border-signal-primary">
                {approvedCount}/{totalMappings} Confirmed
              </Badge>
            </div>
            <AIFieldMappingCoPilot
              mappings={fieldMappings}
              targetFields={[
                { value: "parcel_id", label: "Parcel ID" },
                { value: "situs_address", label: "Situs Address" },
                { value: "land_value", label: "Land Value" },
                { value: "improvement_value", label: "Improvement Value" },
                { value: "total_value", label: "Total Value" },
              ]}
              onConfirm={handleConfirmMapping}
              onSkip={handleSkipMapping}
              onManualMap={handleManualMapping}
              countyName="Washington County"
            />
          </LiquidPanel>
        </TabsContent>

        {/* Capabilities Tab */}
        <TabsContent value="capabilities" className="space-y-4">
          <LiquidPanel intensity={1} className="p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Capability Unlock Dashboard</h3>
            <CapabilityUnlockDashboard
              capabilities={capabilities}
              dataLayers={dataLayers}
            />
          </LiquidPanel>
        </TabsContent>

        {/* Parcel Loader Tab */}
        <TabsContent value="loader" className="space-y-4">
          <LiquidPanel intensity={1} className="p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Parcel Data Loader</h3>
            <WAParcelLoader />
          </LiquidPanel>
        </TabsContent>
      </Tabs>

      {/* Activation CTA */}
      {approvedCount === totalMappings && (
        <div className="flex items-center justify-center py-8">
          <TactileButton
            variant="neon"
            size="lg"
            commitment
            onClick={handleActivateData}
          >
            <Zap className="w-5 h-5 mr-2" />
            Activate Washington County 2026 Roll
          </TactileButton>
        </div>
      )}
    </div>
  );
}
