import { createContext, useContext, useState, ReactNode } from "react";

interface GlobalSimulationContextType {
  isRevalRunning: boolean;
  startReval: () => void;
  revalProgress: number;
  totalParcelsProcessed: number;
  systemResonance: number;
}

const GlobalSimulationContext = createContext<GlobalSimulationContextType | undefined>(undefined);

export function GlobalSimulationProvider({ children }: { children: ReactNode }) {
  const [isRevalRunning, setIsRevalRunning] = useState(false);
  const [revalProgress, setRevalProgress] = useState(0);
  const [totalParcelsProcessed, setTotalParcelsProcessed] = useState(0);
  const [systemResonance, setSystemResonance] = useState(12.000);

  const startReval = () => {
    setIsRevalRunning(true);
    setRevalProgress(0);
    
    // Simulate revaluation process
    const interval = setInterval(() => {
      setRevalProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsRevalRunning(false);
          setTotalParcelsProcessed(prevTotal => prevTotal + 50000);
          setSystemResonance(12.000); // Reset to perfect balance
          return 100;
        }
        // Randomly fluctuate resonance during processing
        setSystemResonance(11.8 + Math.random() * 0.4);
        return prev + 2;
      });
    }, 100);
  };

  return (
    <GlobalSimulationContext.Provider value={{ 
      isRevalRunning, 
      startReval, 
      revalProgress, 
      totalParcelsProcessed,
      systemResonance
    }}>
      {children}
    </GlobalSimulationContext.Provider>
  );
}

export function useGlobalSimulation() {
  const context = useContext(GlobalSimulationContext);
  if (context === undefined) {
    throw new Error("useGlobalSimulation must be used within a GlobalSimulationProvider");
  }
  return context;
}
