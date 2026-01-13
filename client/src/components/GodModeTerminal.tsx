import { useGodMode } from "@/contexts/GodModeContext";
import { useSystemVoice } from "@/hooks/useSystemVoice";
import { AnimatePresence, motion } from "framer-motion";
import { Terminal, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function GodModeTerminal() {
  const { isOpen, setIsOpen, executeCommand, history } = useGodMode();
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && !isOpen) {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, setIsOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const { speak } = useSystemVoice();

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Speak the command confirmation
    if (input.includes("reval")) {
      speak("Initiating county-wide revaluation protocols.");
    } else if (input.includes("deploy")) {
      speak("Deploying agent swarm.");
    } else {
      speak("Command executing.");
    }

    executeCommand(input.trim());
    setInput("");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            onClick={() => setIsOpen(false)}
          />

          {/* Terminal Window */}
          <motion.div
            initial={{ y: "-100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "-100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-0 left-0 right-0 z-50 mx-auto max-w-3xl mt-20"
          >
            <div className="bg-[#0b1020]/95 border border-[#00ffee]/30 rounded-lg shadow-[0_0_50px_rgba(0,255,238,0.2)] overflow-hidden flex flex-col h-[400px]">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-2 bg-[#00ffee]/10 border-b border-[#00ffee]/20">
                <div className="flex items-center gap-2 text-[#00ffee]">
                  <Terminal className="w-4 h-4" />
                  <span className="text-xs font-bold tracking-widest uppercase">God Mode Terminal // Administrator Access</span>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Output Area */}
              <div className="flex-1 p-4 overflow-y-auto font-mono text-sm space-y-1 scrollbar-thin scrollbar-thumb-[#00ffee]/20 scrollbar-track-transparent">
                {history.map((line, i) => (
                  <div key={i} className={`${line.startsWith("<") ? "text-[#00ffee]" : "text-slate-300"}`}>
                    {line}
                  </div>
                ))}
              </div>

              {/* Input Area */}
              <form onSubmit={handleCommand} className="p-4 bg-black/20 border-t border-[#00ffee]/10 flex items-center gap-2">
                <span className="text-[#00ffee] font-bold animate-pulse">{">"}</span>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none text-white font-mono text-sm placeholder-slate-600"
                  placeholder="Enter command..."
                  autoFocus
                />
              </form>
            </div>
            
            <div className="text-center mt-2 text-[10px] text-slate-500 font-mono">
              PRESS ESC TO CLOSE
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
