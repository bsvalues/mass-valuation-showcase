import * as React from "react";
import { useState } from "react";
import { X, Keyboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { LiquidPanel } from "./terra/LiquidPanel";
import { TactileButton } from "./terra/TactileButton";

interface Shortcut {
  keys: string[];
  description: string;
  category: "global" | "navigation" | "assessment";
}

const shortcuts: Shortcut[] = [
  // Global
  { keys: ["⌘", "K"], description: "Open Command Palette", category: "global" },
  { keys: ["?"], description: "Show keyboard shortcuts", category: "global" },
  { keys: ["Esc"], description: "Close overlays / Clear selection", category: "global" },
  
  // Navigation
  { keys: ["⌘", "1"], description: "Data Suite", category: "navigation" },
  { keys: ["⌘", "2"], description: "Analysis Suite", category: "navigation" },
  { keys: ["⌘", "3"], description: "Valuation Suite", category: "navigation" },
  { keys: ["⌘", "4"], description: "Compliance Suite", category: "navigation" },
  
  // Assessment Review
  { keys: ["A"], description: "Approve selected properties", category: "assessment" },
  { keys: ["F"], description: "Flag selected properties", category: "assessment" },
];

export function KeyboardShortcutsOverlay() {
  const [isOpen, setIsOpen] = useState(false);

  // Listen for ? key to toggle
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "?" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        // Only trigger if not in input/textarea
        const target = e.target as HTMLElement;
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
          e.preventDefault();
          setIsOpen(prev => !prev);
        }
      }
      
      // Close on Escape
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const categoryLabels = {
    global: "Global Shortcuts",
    navigation: "Suite Navigation",
    assessment: "Assessment Review",
  };

  return (
    <>
      {/* Floating ? Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-24 right-6 z-40",
          "w-12 h-12 rounded-full",
          "bg-glass-2 border border-glass-border",
          "flex items-center justify-center",
          "text-signal-primary hover:text-signal-primary-dark",
          "transition-all duration-300",
          "hover:scale-110 hover:shadow-neon",
          "backdrop-blur-xl"
        )}
        aria-label="Show keyboard shortcuts"
      >
        <Keyboard className="w-5 h-5" />
      </button>

      {/* Overlay */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-200"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <LiquidPanel
              className="w-full max-w-2xl pointer-events-auto animate-in fade-in zoom-in-95 duration-300"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-glass-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-glass-2 flex items-center justify-center text-signal-primary">
                    <Keyboard className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-text-primary">
                      Keyboard Shortcuts
                    </h2>
                    <p className="text-sm text-text-secondary">
                      Navigate faster with keyboard commands
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-lg bg-glass-2 hover:bg-glass-3 flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                {(["global", "navigation", "assessment"] as const).map(category => {
                  const categoryShortcuts = shortcuts.filter(s => s.category === category);
                  if (categoryShortcuts.length === 0) return null;

                  return (
                    <div key={category}>
                      <h3 className="text-sm font-semibold text-signal-primary uppercase tracking-wider mb-3">
                        {categoryLabels[category]}
                      </h3>
                      <div className="space-y-2">
                        {categoryShortcuts.map((shortcut, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 rounded-lg bg-glass-1 hover:bg-glass-2 transition-colors"
                          >
                            <span className="text-sm text-text-primary">
                              {shortcut.description}
                            </span>
                            <div className="flex items-center gap-1">
                              {shortcut.keys.map((key, keyIdx) => (
                                <React.Fragment key={keyIdx}>
                                  <kbd className="px-2 py-1 text-xs font-mono rounded bg-glass-3 border border-glass-border text-text-primary">
                                    {key}
                                  </kbd>
                                  {keyIdx < shortcut.keys.length - 1 && (
                                    <span className="text-text-tertiary text-xs">+</span>
                                  )}
                                </React.Fragment>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-glass-border">
                <p className="text-xs text-text-secondary text-center">
                  Press <kbd className="px-2 py-0.5 text-xs font-mono rounded bg-glass-2 border border-glass-border text-text-primary">?</kbd> anytime to toggle this overlay
                </p>
              </div>
            </LiquidPanel>
          </div>
        </>
      )}
    </>
  );
}
