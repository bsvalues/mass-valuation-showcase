import { useGodMode } from "@/contexts/GodModeContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Mic, MicOff } from "lucide-react";
import { useEffect, useState } from "react";

export function VoiceCommandInterface() {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const { executeCommand, setIsOpen: setGodModeOpen } = useGodMode();

  useEffect(() => {
    if (isOpen) {
      setIsListening(true);
      setTranscript("Listening...");
      
      // Simulate voice recognition
      const timer = setTimeout(() => {
        const command = "/run-reval --scope=county";
        setTranscript("Run county-wide revaluation...");
        
        setTimeout(() => {
          setIsListening(false);
          setTimeout(() => {
            setIsOpen(false);
            setGodModeOpen(true);
            executeCommand(command);
          }, 1000);
        }, 2000);
      }, 1500);
      
      return () => clearTimeout(timer);
    } else {
      setIsListening(false);
      setTranscript("");
    }
  }, [isOpen, executeCommand, setGodModeOpen]);

  return (
    <>
      <Button 
        variant="ghost" 
        size="icon" 
        className="rounded-full w-10 h-10 bg-primary/10 hover:bg-primary/20 text-primary active-recoil"
        onClick={() => setIsOpen(true)}
      >
        <Mic className="w-5 h-5" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md bg-black/80 backdrop-blur-xl border-primary/30 text-center p-12 shadow-[0_0_50px_rgba(0,255,255,0.2)]">
          <DialogTitle className="sr-only">Voice Command Interface</DialogTitle>
          
          <div className="flex flex-col items-center justify-center space-y-8">
            {/* Visualizer */}
            <div className="relative w-32 h-32 flex items-center justify-center">
              {isListening ? (
                <>
                  <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" />
                  <div className="absolute inset-4 rounded-full border-2 border-primary/50 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite_0.5s]" />
                  <div className="absolute inset-8 rounded-full border-2 border-primary/70 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite_1s]" />
                  <div className="relative z-10 w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-[0_0_30px_rgba(0,255,255,0.6)]">
                    <Mic className="w-8 h-8 text-black animate-pulse" />
                  </div>
                </>
              ) : (
                <div className="relative z-10 w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <MicOff className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Transcript */}
            <div className="space-y-2">
              <h3 className={cn(
                "text-2xl font-light tracking-tight transition-all duration-500",
                isListening ? "text-primary" : "text-muted-foreground"
              )}>
                {isListening ? "Listening..." : "Processing"}
              </h3>
              <p className="text-lg font-mono text-primary/80 h-8">
                {transcript !== "Listening..." && transcript}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
