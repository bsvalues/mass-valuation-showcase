// Layout provided by App.tsx (SystemBar, Stage, Dock)
import { BentoCard, BentoGrid } from "@/components/terra/BentoCard";
import { TactileButton } from "@/components/terra/TactileButton";
import { 
  Database, 
  TrendingUp, 
  BarChart3, 
  Shield, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Zap,
  Target,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

/**
 * Home - "Mission Control" Canonical Scene
 * 
 * TerraFusion Design Principles Applied:
 * - Bento Grid as "Attention Allocator" - each card promotes next required step
 * - Context Mode: Cards expand/shrink based on user's current workflow state
 * - "3 Clicks to Value": Dock → Mission Control → Specific Tool
 * - Glass materials for OS chrome only, Bento cards for data modules
 */
export default function Home() {
  const { user, loading } = useAuth();
  
  // System health metrics would be fetched here in production

  // Show layout immediately, user info will load in background

  return (
    <>
      {/* Hero Section */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-text-primary mb-2">
          Mission Control
        </h1>
        <p className="text-lg text-text-secondary">
          Engineering Certainty in Valuation. {user?.name}, your next actions are prioritized below.
        </p>
      </div>

      {/* Bento Grid - Living Dashboard */}
      <BentoGrid>
        {/* Data Ingestion Status */}
        <BentoCard
          title="Data Ingestion"
          description="Washington County 2026 Assessment Roll"
          icon={<Database className="w-5 h-5" />}
          span="2"
          actionable={false}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">Total Parcels</span>
              <span className="text-2xl font-bold text-text-primary">27,753</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">Last Sync</span>
              <span className="text-sm text-text-primary flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-chart-4" />
                2 hours ago
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">Data Quality</span>
              <span className="text-sm text-chart-4 font-medium">98.4% Pass</span>
            </div>

            <TactileButton
              variant="glass"
              size="sm"
              className="w-full mt-4"
              onClick={() => window.location.href = "/wa-data-ingestion"}
            >
              View Details
              <ArrowRight className="w-4 h-4 ml-2" />
            </TactileButton>
          </div>
        </BentoCard>

        {/* Valuation Model Status */}
        <BentoCard
          title="Valuation Model"
          description="2026 Mass Appraisal Run"
          icon={<TrendingUp className="w-5 h-5" />}
          span="1"
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-text-secondary" />
              <span className="text-sm text-text-secondary">Status:</span>
              <span className="text-sm text-chart-4 font-medium">Ready</span>
            </div>
            
            <div className="text-xs text-text-tertiary">
              Last calibration: Jan 15, 2026
            </div>

            <TactileButton
              variant="neon"
              size="sm"
              commitment
              className="w-full mt-4"
            >
              <Zap className="w-4 h-4 mr-2" />
              Run Model
            </TactileButton>
          </div>
        </BentoCard>

        {/* Assessment Review - Actionable Card */}
        <BentoCard
          title="Assessment Review"
          description="High-variance properties require attention"
          icon={<AlertTriangle className="w-5 h-5" />}
          span="2"
          actionable
        >
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="text-3xl font-bold text-signal-alert">142</div>
                <div className="text-xs text-text-secondary">Properties flagged</div>
              </div>
              
              <div className="flex-1">
                <div className="text-3xl font-bold text-chart-3">18.7%</div>
                <div className="text-xs text-text-secondary">Avg variance</div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-signal-alert/10 border border-signal-alert/30">
              <p className="text-sm text-text-primary">
                <strong>Action Required:</strong> Review properties with ratio variance &gt;15% before certification deadline (Feb 28).
              </p>
            </div>

            <TactileButton
              variant="neon"
              size="sm"
              className="w-full"
              onClick={() => window.location.href = "/assessment-review"}
            >
              <Target className="w-4 h-4 mr-2" />
              Review Now
            </TactileButton>
          </div>
        </BentoCard>

        {/* Analysis Tools */}
        <BentoCard
          title="Analysis Suite"
          description="Property comparison and market trends"
          icon={<BarChart3 className="w-5 h-5" />}
          span="1"
        >
          <div className="space-y-3">
            <button
              onClick={() => window.location.href = "/property-comparison"}
              className="w-full text-left p-2 rounded-lg hover:bg-glass-1 transition-colors"
            >
              <div className="text-sm font-medium text-text-primary">Property Comparison</div>
              <div className="text-xs text-text-secondary">Side-by-side analysis</div>
            </button>
            
            <button
              onClick={() => window.location.href = "/map-explorer"}
              className="w-full text-left p-2 rounded-lg hover:bg-glass-1 transition-colors"
            >
              <div className="text-sm font-medium text-text-primary">Map Explorer</div>
              <div className="text-xs text-text-secondary">Spatial analysis</div>
            </button>
          </div>
        </BentoCard>

        {/* Governance & Compliance */}
        <BentoCard
          title="Governance"
          description="Audit logs and compliance tracking"
          icon={<Shield className="w-5 h-5" />}
          span="full"
        >
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-2xl font-bold text-text-primary">1,247</div>
              <div className="text-xs text-text-secondary">Audit events (30 days)</div>
            </div>
            
            <div>
              <div className="text-2xl font-bold text-chart-4">100%</div>
              <div className="text-xs text-text-secondary">Compliance score</div>
            </div>
            
            <div>
              <div className="text-2xl font-bold text-text-primary">14</div>
              <div className="text-xs text-text-secondary">Days until certification</div>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <TactileButton
              variant="glass"
              size="sm"
              onClick={() => window.location.href = "/assessment-audit-log"}
            >
              View Audit Log
            </TactileButton>
            
            <TactileButton
              variant="glass"
              size="sm"
            >
              Export Report
            </TactileButton>
          </div>
        </BentoCard>
      </BentoGrid>

      {/* System Status Footer */}
      <div className="mt-8 p-4 rounded-xl bg-glass-1 border border-glass-border">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-chart-4 animate-pulse" />
            <span className="text-text-secondary">System Status:</span>
            <span className="text-chart-4 font-medium">All Systems Operational</span>
          </div>
          
          <div className="text-text-tertiary">
            TerraFusion OS v1.0 • Washington County Assessor's Office
          </div>
        </div>
      </div>
    </>
  );
}
