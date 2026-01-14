import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { AnimatedTerraLogo } from "./AnimatedTerraLogo";

interface IgnitionSequenceProps {
  onComplete: () => void;
}

export function IgnitionSequence({ onComplete }: IgnitionSequenceProps) {
  const [step, setStep] = useState(0);
  const [text, setText] = useState("");

  const steps = [
    { time: 500, text: "INITIALIZING TERRAFORGE..." },
    { time: 1500, text: "LOADING QUANTUM VALUATION ENGINE..." },
    { time: 2500, text: "ESTABLISHING MARKET CALIBRATION..." },
    { time: 3500, text: "SYNCHRONIZING 3-6-9 PROTOCOLS..." },
    { time: 4500, text: "TERRAFORGE ONLINE." },
  ];

  useEffect(() => {
    let timeout: NodeJS.Timeout | undefined;

    const runSequence = async () => {
      for (let i = 0; i < steps.length; i++) {
        setStep(i);
        setText(steps[i].text);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      timeout = setTimeout(onComplete, 1000);
    };

    runSequence();

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-[#050A14] flex flex-col items-center justify-center overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00ffff05_1px,transparent_1px),linear-gradient(to_bottom,#00ffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

      <div className="relative z-10 flex flex-col items-center">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="mb-12"
        >
          <AnimatedTerraLogo size={120} className="animate-pulse-slow" />
        </motion.div>

        <div className="h-8 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={text}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-[#00FFFF] font-mono text-sm tracking-[0.3em] uppercase"
            >
              {text}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Progress Bar */}
        <div className="mt-8 w-64 h-1 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-[#00FFFF] shadow-[0_0_10px_#00FFFF]"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 5, ease: "linear" }}
          />
        </div>
      </div>
    </div>
  );
}
