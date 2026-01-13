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


function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/governance"} component={Governance} />
      <Route path={"/cost-matrix"} component={CostMatrix} />
      <Route path={"/map-explorer"} component={MapExplorer} />
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
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <AdaptiveThemeProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AdaptiveThemeProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
