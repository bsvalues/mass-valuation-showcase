import { GodModeTerminal } from "@/components/GodModeTerminal";
import { IgnitionSequence } from "@/components/IgnitionSequence";
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
      <ThemeProvider
        defaultTheme="dark"
        switchable
      >
        <AdaptiveThemeProvider>
          <GlobalSimulationProvider>
            <GodModeProvider>
              <TooltipProvider>
              <GodModeTerminal />
              <Toaster />
              <Router />
              </TooltipProvider>
            </GodModeProvider>
          </GlobalSimulationProvider>
        </AdaptiveThemeProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
