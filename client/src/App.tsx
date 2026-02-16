import { GodModeTerminal } from "@/components/GodModeTerminal";
import { CommandPalette } from "@/components/CommandPalette";
import { ControlCenter } from "@/components/ControlCenter";
import { KeyboardShortcutsOverlay } from "@/components/KeyboardShortcutsOverlay";
import { Dock } from "@/components/Dock";
import { Stage } from "@/components/Stage";
import { SystemBar } from "@/components/SystemBar";
import { IgnitionSequence } from "@/components/IgnitionSequence";
import { PerformanceMonitor } from "@/components/PerformanceMonitor";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { GodModeProvider } from "@/contexts/GodModeContext";
import { GlobalSimulationProvider } from "@/contexts/GlobalSimulationContext";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AdaptiveThemeProvider } from "./contexts/AdaptiveThemeContext";
import { WAParcelProvider } from "./contexts/WAParcelContext";
import { JobProvider } from "./contexts/JobContext";
import Home from "./pages/Home";
import Governance from "./pages/Governance";
import CostMatrix from "./pages/CostMatrix";
import MapExplorer from "./pages/MapExplorer";
import CalibrationStudio from "./pages/CalibrationStudio";
import MassValuationStudio from "./pages/MassValuationStudio";
import DefenseStudio from "./pages/DefenseStudio";
import NeuralCore from "./pages/NeuralCore";
import ModelsAlgorithms from "./pages/ModelsAlgorithms";
import MarketAnalysis from "./pages/MarketAnalysis";
import AdminUsers from "./pages/AdminUsers";
import RegressionStudio from "./pages/RegressionStudio";
import AVMStudio from "./pages/AVMStudio";
import ModelManagement from "./pages/ModelManagement";
import DataImport from "./pages/DataImport";
import BatchValuation from "./pages/BatchValuation";
import WADataIngestion from "./pages/WADataIngestion";
import CountyProgressDashboard from "./pages/CountyProgressDashboard";
import CountyDataDashboard from "./pages/CountyDataDashboard";
import CountyDetail from "./pages/CountyDetail";
import QARatioStudies from "./pages/QARatioStudies";
import WASalesIngestion from "./pages/WASalesIngestion";
import MLTraining from "./pages/MLTraining";
import AppealsManagement from "./pages/AppealsManagement";
import BulkAppealImportPage from "./pages/BulkAppealImportPage";
import AppealAuditLog from "./pages/AppealAuditLog";
import TemplateManagement from "./pages/TemplateManagement";
import AppealAnalytics from "./pages/AppealAnalytics";
import AppealsAnalytics from "./pages/AppealsAnalytics";
import AppealTemplates from "./pages/AppealTemplates";
import AppealComparison from "./pages/AppealComparison";
import AppealDefenseBuilder from "./pages/AppealDefenseBuilder";
import MassAppraisalDashboard from "./pages/MassAppraisalDashboard";
import RatioStudyAnalyzer from "./pages/RatioStudyAnalyzer";
import ValueDriverAnalysis from "./pages/ValueDriverAnalysis";
import ClusterHeatmap from "./pages/ClusterHeatmap";
import PropertyComparison from "./pages/PropertyComparison";
import AssessmentReview from "./pages/AssessmentReview";
import AssessmentAuditLog from "./pages/AssessmentAuditLog";


function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/governance"} component={Governance} />
      <Route path={"/cost-matrix"} component={CostMatrix} />
      <Route path={"/map-explorer"} component={MapExplorer} />
      <Route path={"/models"} component={ModelsAlgorithms} />
      <Route path={"/regression"} component={RegressionStudio} />
      <Route path={"/avm-studio"} component={AVMStudio} />
      <Route path={"/model-management"} component={ModelManagement} />
      <Route path={"/calibration"} component={CalibrationStudio} />
      <Route path={"/mass-valuation"} component={MassValuationStudio} />
      <Route path={"/analysis"} component={MarketAnalysis} />
      <Route path={"/defense"} component={DefenseStudio} />
      <Route path={"/neural-core"} component={NeuralCore} />
      <Route path={"/admin/users"} component={AdminUsers} />
      <Route path={"/county-progress"} component={CountyProgressDashboard} />
      <Route path={"/county-data-dashboard"} component={CountyDataDashboard} />
      <Route path={"/county-detail/:countyName"} component={CountyDetail} />
      <Route path={"/qa-ratio-studies"} component={QARatioStudies} />
      <Route path={"/wa-sales-ingestion"} component={WASalesIngestion} />
      <Route path={"/ml-training"} component={MLTraining} />
      <Route path={"/appeals"} component={AppealsManagement} />
      <Route path={"/appeals/import"} component={BulkAppealImportPage} />
      <Route path={"/appeals/audit-log"} component={AppealAuditLog} />
      <Route path={"/appeals/analytics"} component={AppealsAnalytics} />
      <Route path={"/appeals/comparison"} component={AppealComparison} />
      <Route path={"/appeals/templates"} component={TemplateManagement} />
      <Route path={"/appeals/appeal-templates"} component={AppealTemplates} />
      <Route path={"/appeals/defense-builder"} component={AppealDefenseBuilder} />
      <Route path={"/appeal-defense"} component={AppealDefenseBuilder} />
      <Route path={"/mass-appraisal-dashboard"} component={MassAppraisalDashboard} />
      <Route path={"/ratio-study-analyzer"} component={RatioStudyAnalyzer} />
      <Route path={"/value-drivers"} component={ValueDriverAnalysis} />
      <Route path={"/cluster-map"} component={ClusterHeatmap} />
      <Route path={"/property-comparison"} component={PropertyComparison} />
      <Route path={"/assessment-review"} component={AssessmentReview} />
      <Route path={"/assessment-audit-log"} component={AssessmentAuditLog} />
      <Route path={"/data-import"} component={DataImport} />
      <Route path={"/batch-valuation"} component={BatchValuation} />
      <Route path={"/wa-data-ingestion"} component={WADataIngestion} />

      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  const [ignited, setIgnited] = useState(true); // Skip ignition for now
  const [, setLocation] = useLocation();

  // Keyboard shortcuts for Dock suite navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ⌘+1/2/3/4 for Dock suite switching
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey) {
        switch (e.key) {
          case '1':
            e.preventDefault();
            setLocation('/wa-data-ingestion'); // Data Suite
            break;
          case '2':
            e.preventDefault();
            setLocation('/property-comparison'); // Analysis Suite
            break;
          case '3':
            e.preventDefault();
            setLocation('/avm-studio'); // Valuation Suite
            break;
          case '4':
            e.preventDefault();
            setLocation('/appeals'); // Compliance Suite
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setLocation]);

  // Ignition sequence temporarily disabled for development
  // if (!ignited) {
  //   return <IgnitionSequence onComplete={() => setIgnited(true)} />;
  // }

  return (
    <ErrorBoundary>
      <PerformanceMonitor enabled={import.meta.env.DEV}>
        <ThemeProvider
          defaultTheme="dark"
          switchable
        >
        <AdaptiveThemeProvider>
      <GlobalSimulationProvider>
        <WAParcelProvider>
          <JobProvider>
            <GodModeProvider>
                <TooltipProvider>
                <GodModeTerminal />
                <Toaster />
                
                {/* TerraFusion OS Architecture */}
                <SystemBar />
                <Stage>
                  <Router />
                </Stage>
                <Dock />
                <CommandPalette />
                <ControlCenter />
                <KeyboardShortcutsOverlay />
                </TooltipProvider>
              </GodModeProvider>
            </JobProvider>
          </WAParcelProvider>
        </GlobalSimulationProvider>
        </AdaptiveThemeProvider>
        </ThemeProvider>
      </PerformanceMonitor>
    </ErrorBoundary>
  );
}

export default App;
