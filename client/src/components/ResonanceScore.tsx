import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface ResonanceScoreProps {
  score: number; // 0 to 12.000
  className?: string;
}

export function ResonanceScore({ score, className }: ResonanceScoreProps) {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    // Animate score count up
    const duration = 2000;
    const steps = 60;
    const increment = score / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= score) {
        current = score;
        clearInterval(timer);
      }
      setDisplayScore(current);
    }, duration / steps);

    return () => clearInterval(timer);
  }, [score]);

  // Calculate ring colors based on score
  const getRingColor = (val: number) => {
    if (val >= 11.5) return "border-[#00ffee] shadow-[0_0_15px_#00ffee]";
    if (val >= 9) return "border-[#ffd700] shadow-[0_0_10px_#ffd700]";
    return "border-red-500 shadow-[0_0_10px_red]";
  };

  return (
    <div className={cn("relative flex items-center justify-center w-32 h-32", className)}>
      {/* Outer Ring - 9 (Ultimate Power) */}
      <div className={cn(
        "absolute inset-0 rounded-full border-2 opacity-30 animate-[spin_10s_linear_infinite]",
        getRingColor(displayScore)
      )} />
      
      {/* Middle Ring - 6 (Amplification) */}
      <div className={cn(
        "absolute inset-2 rounded-full border-2 opacity-50 animate-[spin_7s_linear_infinite_reverse]",
        getRingColor(displayScore)
      )} />
      
      {/* Inner Ring - 3 (Foundation) */}
      <div className={cn(
        "absolute inset-4 rounded-full border-2 opacity-80 animate-[spin_4s_linear_infinite]",
        getRingColor(displayScore)
      )} />

      {/* Core Score */}
      <div className="relative z-10 text-center">
        <div className="text-2xl font-bold font-mono text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">
          {displayScore.toFixed(3)}
        </div>
        <div className="text-[10px] uppercase tracking-widest text-slate-400 mt-1">
          Resonance
        </div>
      </div>
    </div>
  );
}
