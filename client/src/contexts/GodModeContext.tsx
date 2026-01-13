import { createContext, useContext, useState } from "react";

interface GodModeContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  executeCommand: (command: string) => void;
  history: string[];
}

const GodModeContext = createContext<GodModeContextType | undefined>(undefined);

export function GodModeProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [history, setHistory] = useState<string[]>([
    "> TerraFusion Sovereign OS v4.1.0",
    "> God Mode Terminal Initialized...",
    "> Type /help for available commands."
  ]);

  const executeCommand = (cmd: string) => {
    setHistory(prev => [...prev, `> ${cmd}`]);
    
    // Simulate command execution
    setTimeout(() => {
      let response = "";
      if (cmd.startsWith("/run-reval")) {
        response = "Initiating County-Wide Revaluation... [Rust Core: ACTIVE]";
      } else if (cmd.startsWith("/deploy-agent")) {
        response = "Deploying Autonomous Agent... [Target: " + (cmd.split(" ")[1] || "Unknown") + "]";
      } else if (cmd === "/help") {
        response = "Available Commands: /run-reval, /deploy-agent, /status, /calibrate, /override-lock";
      } else if (cmd === "/status") {
        response = "System Vitality: 12.000 | Resonance: 8.400 | Agents: 4 Active";
      } else {
        response = `Command not recognized: ${cmd.split(" ")[0]}`;
      }
      setHistory(prev => [...prev, `< ${response}`]);
    }, 200);
  };

  return (
    <GodModeContext.Provider value={{ isOpen, setIsOpen, executeCommand, history }}>
      {children}
    </GodModeContext.Provider>
  );
}

export function useGodMode() {
  const context = useContext(GodModeContext);
  if (context === undefined) {
    throw new Error("useGodMode must be used within a GodModeProvider");
  }
  return context;
}
