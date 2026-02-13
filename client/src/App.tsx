import { GodModeTerminal } from "@/components/GodModeTerminal";
import { CommandPalette } from "@/components/CommandPalette";
import { Dock } from "@/components/Dock";
import { Stage } from "@/components/Stage";
import { SystemBar } from "@/components/SystemBar";
import { IgnitionSequence } from "@/components/IgnitionSequence";
import { PerformanceMonitor } from "@/components/PerformanceMonitor";
import { useState } from "react";
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
      <Route path={" /ratio-study-analyzer"} component={RatioStudyAnalyzer} />
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
  const [ignited, setIgnited] = useState(false);

  if (!ignited) {
    return <IgnitionSequence onComplete={() => setIgnited(true)} />;
  }

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
