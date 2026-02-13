import { useGodMode } from "@/contexts/GodModeContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { cn } from "@/lib/utils";
import { Mic, MicOff } from "lucide-react";
import { useEffect, useState } from "react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

export function VoiceCommandInterface() {
  const [isOpen, setIsOpen] = useState(false);
  const { 
    isListening, 
    transcript, 
    startListening, 
    stopListening, 
    resetTranscript,
    isSupported 
  } = useSpeechRecognition();
  const { executeCommand, setIsOpen: setGodModeOpen } = useGodMode();

  // Auto-start listening when dialog opens
  useEffect(() => {
    if (isOpen) {
      resetTranscript();
      startListening();
    } else {
      stopListening();
    }
  }, [isOpen, startListening, stopListening, resetTranscript]);

  // Process command when listening stops and we have a transcript
  useEffect(() => {
    if (!isListening && transcript && isOpen) {
      const processCommand = (text: string) => {
        const lowerText = text.toLowerCase();
        if (lowerText.includes("revaluation") || lowerText.includes("reval")) return "/run-reval --scope=county";
        if (lowerText.includes("deploy") || lowerText.includes("agent")) return "/deploy-agent --target=legal";
        if (lowerText.includes("status") || lowerText.includes("report")) return "/status";
        if (lowerText.includes("calibrate") || lowerText.includes("tune")) return "/calibrate";
        return `/unknown-command "${text}"`;
      };

      const command = processCommand(transcript);
      
      // Small delay for user to see what was heard
      const timer = setTimeout(() => {
        setIsOpen(false);
        setGodModeOpen(true);
        executeCommand(command);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [isListening, transcript, isOpen, setIsOpen, setGodModeOpen, executeCommand]);

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
          <VisuallyHidden.Root>
            <DialogTitle>Voice Command Interface</DialogTitle>
          </VisuallyHidden.Root>
          
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
                {!isSupported ? "Browser Not Supported" : (isListening ? "Listening..." : "Processing")}
              </h3>
              <p className="text-lg font-mono text-primary/80 h-8">
                {transcript}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
