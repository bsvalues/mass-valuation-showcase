import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Search, Clock } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export interface SearchSuggestion {
  id: string;
  address: string;
  parcelNumber: string;
  assessedValue: number;
  type: "property" | "recent";
}

interface SearchAutocompleteProps {
  suggestions: SearchSuggestion[];
  onSelect: (suggestion: SearchSuggestion) => void;
  isOpen: boolean;
  searchQuery: string;
}

export function SearchAutocomplete({
  suggestions,
  onSelect,
  isOpen,
  searchQuery,
}: SearchAutocompleteProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Reset selected index when suggestions change
  useEffect(() => {
    setSelectedIndex(0);
  }, [suggestions]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || suggestions.length === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < suggestions.length - 1 ? prev + 1 : prev
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
          break;
        case "Enter":
          e.preventDefault();
          if (suggestions[selectedIndex]) {
            onSelect(suggestions[selectedIndex]);
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, suggestions, selectedIndex, onSelect]);

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (!isOpen || suggestions.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={dropdownRef}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="absolute top-full left-0 right-0 mt-2 z-50"
        style={{
          maxHeight: "400px",
          overflowY: "auto",
        }}
      >
        {/* Liquid Glass Container */}
        <div
          className="rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
          style={{
            background: "rgba(11, 16, 32, 0.85)",
            backdropFilter: "blur(24px) saturate(180%)",
            border: "1px solid rgba(0, 255, 238, 0.2)",
          }}
        >
          {/* Search Results Header */}
          <div className="px-4 py-3 border-b border-cyan-500/20">
            <div className="flex items-center gap-2 text-xs font-medium text-cyan-400/80 uppercase tracking-wider">
              <Search className="w-3.5 h-3.5" />
              <span>
                {suggestions.length} Result{suggestions.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {/* Suggestions List */}
          <div className="py-2">
            {suggestions.map((suggestion, index) => (
              <motion.button
                key={suggestion.id}
                onClick={() => onSelect(suggestion)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`w-full px-4 py-3 flex items-start gap-3 transition-all duration-200 ${
                  index === selectedIndex
                    ? "bg-cyan-500/10"
                    : "hover:bg-cyan-500/5"
                }`}
                whileHover={{ x: 4 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                {/* Icon */}
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                    suggestion.type === "recent"
                      ? "bg-amber-500/10"
                      : "bg-cyan-500/10"
                  }`}
                >
                  {suggestion.type === "recent" ? (
                    <Clock className="w-4 h-4 text-amber-400" />
                  ) : (
                    <MapPin className="w-4 h-4 text-cyan-400" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 text-left min-w-0">
                  {/* Address - Highlight matching text */}
                  <div className="text-sm font-medium text-white/90 mb-0.5">
                    {highlightMatch(suggestion.address, searchQuery)}
                  </div>

                  {/* Parcel Number & Value */}
                  <div className="flex items-center gap-3 text-xs text-white/50">
                    <span className="font-mono">
                      {suggestion.parcelNumber}
                    </span>
                    <span className="text-cyan-400/70">
                      {formatCurrency(suggestion.assessedValue)}
                    </span>
                  </div>
                </div>

                {/* Selected Indicator */}
                {index === selectedIndex && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-cyan-400"
                  />
                )}
              </motion.button>
            ))}
          </div>

          {/* Footer Hint */}
          <div className="px-4 py-2 border-t border-cyan-500/10 bg-black/20">
            <div className="flex items-center justify-between text-xs text-white/40">
              <span>Use ↑↓ to navigate</span>
              <span>Press ↵ to select</span>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Helper function to highlight matching text
function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;

  const regex = new RegExp(`(${query})`, "gi");
  const parts = text.split(regex);

  return parts.map((part, index) =>
    regex.test(part) ? (
      <span key={index} className="text-cyan-400 font-semibold">
        {part}
      </span>
    ) : (
      <span key={index}>{part}</span>
    )
  );
}
