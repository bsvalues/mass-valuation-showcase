/**
 * QuantumProgressBar - TerraFusion-style progress visualization
 * Features: Cyan glow, particle effects, pulsing energy ring
 */

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface QuantumProgressBarProps {
  progress: number; // Current count (e.g., 10000)
  total: number; // Total expected (e.g., 80000)
  currentChunk?: number; // Current chunk number (e.g., 5)
  totalChunks?: number; // Total chunks (e.g., 40)
  status?: string; // Status text (e.g., "Quantum loading...")
  estimatedTimeRemaining?: number; // Seconds remaining
}

export function QuantumProgressBar({
  progress,
  total,
  currentChunk,
  totalChunks,
  status = "Processing...",
  estimatedTimeRemaining,
}: QuantumProgressBarProps) {
  const percentage = total > 0 ? Math.min(100, Math.round((progress / total) * 100)) : 0;
  
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  return (
    <div className="space-y-4">
      {/* Progress Bar Container */}
      <div className="relative">
        {/* Background Track */}
        <div className="h-3 bg-background/40 rounded-full overflow-hidden border border-primary/20 backdrop-blur-sm">
          {/* Animated Progress Fill */}
          <motion.div
            className="h-full bg-gradient-to-r from-primary via-cyan-400 to-primary rounded-full relative"
            style={{
              boxShadow: "0 0 20px rgba(0, 255, 238, 0.5), inset 0 0 10px rgba(255, 255, 255, 0.3)",
            }}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            {/* Flowing Particles */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{
                x: ["-100%", "200%"],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          </motion.div>
        </div>
        
        {/* Percentage Badge with Pulsing Ring */}
        <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 -translate-y-full mb-2">
          <motion.div
            className="relative flex items-center justify-center"
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {/* Pulsing Energy Ring */}
            <motion.div
              className="absolute w-16 h-16 rounded-full border-2 border-primary/40"
              animate={{
                scale: [1, 1.3],
                opacity: [0.5, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeOut",
              }}
            />
            
            {/* Percentage Display */}
            <div className="relative z-10 w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 backdrop-blur-xl border border-primary/30 flex items-center justify-center shadow-[0_0_30px_rgba(0,255,238,0.4)]">
              <span className="text-lg font-bold text-primary">{percentage}%</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Status and Details */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span className="font-medium">{status}</span>
        </div>
        
        {estimatedTimeRemaining !== undefined && estimatedTimeRemaining > 0 && (
          <span className="text-muted-foreground">
            ~{formatTime(estimatedTimeRemaining)} remaining
          </span>
        )}
      </div>

      {/* Chunk Counter */}
      {currentChunk !== undefined && totalChunks !== undefined && (
        <div className="flex items-center justify-between text-xs text-muted-foreground bg-background/20 rounded-lg p-3 border border-primary/10">
          <span>
            Chunk <span className="text-primary font-bold">{currentChunk}</span> of {totalChunks}
          </span>
          <span className="font-mono">
            {progress.toLocaleString()} / {total.toLocaleString()} parcels
          </span>
        </div>
      )}
    </div>
  );
}
