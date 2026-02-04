import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";
import { X, TrendingUp, DollarSign, Home } from "lucide-react";
import { useEffect, useRef } from "react";

interface ClusterTooltipProps {
  x: number;
  y: number;
  propertyIds: number[];
  onClose: () => void;
}

export function ClusterTooltip({ x, y, propertyIds, onClose }: ClusterTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Fetch cluster statistics
  const { data: stats, isLoading } = trpc.parcels.getClusterStats.useQuery(
    { propertyIds },
    { enabled: propertyIds.length > 0 }
  );

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Determine color based on average value
  const getValueColor = (avgValue: number) => {
    if (avgValue < 200000) return "text-green-400";
    if (avgValue < 400000) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <motion.div
      ref={tooltipRef}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className="fixed z-50"
      style={{
        left: `${x + 20}px`,
        top: `${y - 100}px`,
        maxWidth: "320px",
      }}
    >
      {/* Liquid Glass Container */}
      <div
        className="rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
        style={{
          background: "rgba(11, 16, 32, 0.92)",
          backdropFilter: "blur(24px) saturate(180%)",
          border: "1px solid rgba(0, 255, 238, 0.2)",
        }}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-cyan-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Home className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-semibold text-cyan-400 uppercase tracking-wider">
              Cluster Statistics
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white/90 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="px-4 py-6 text-center">
            <div className="animate-spin w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full mx-auto" />
            <p className="text-xs text-white/50 mt-2">Loading statistics...</p>
          </div>
        ) : stats ? (
          <div className="px-4 py-3 space-y-3">
            {/* Property Count */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/60">Properties</span>
              <span className="text-lg font-bold text-white">{stats.count}</span>
            </div>

            {/* Average Value */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-xs text-white/60">Avg Value</span>
              </div>
              <span className={`text-lg font-bold ${getValueColor(stats.avgValue)}`}>
                {formatCurrency(stats.avgValue)}
              </span>
            </div>

            {/* Value Range */}
            <div className="pt-2 border-t border-white/10">
              <div className="flex items-center gap-1.5 mb-2">
                <DollarSign className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-xs text-white/60">Value Range</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/70">
                  Min: <span className="font-semibold text-white">{formatCurrency(stats.minValue)}</span>
                </span>
                <span className="text-white/40">•</span>
                <span className="text-white/70">
                  Max: <span className="font-semibold text-white">{formatCurrency(stats.maxValue)}</span>
                </span>
              </div>
            </div>

            {/* Sample Properties */}
            {stats.properties && stats.properties.length > 0 && (
              <div className="pt-2 border-t border-white/10">
                <span className="text-xs text-white/60 mb-2 block">Sample Properties</span>
                <div className="space-y-1.5">
                  {stats.properties.map((prop: any) => (
                    <div
                      key={prop.id}
                      className="text-xs text-white/70 flex items-center justify-between"
                    >
                      <span className="truncate flex-1 mr-2">{prop.address}</span>
                      <span className="font-mono text-cyan-400/70">
                        {formatCurrency(prop.assessedValue)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="px-4 py-6 text-center">
            <p className="text-xs text-white/50">No data available</p>
          </div>
        )}

        {/* Footer Hint */}
        <div className="px-4 py-2 border-t border-cyan-500/10 bg-black/20">
          <p className="text-xs text-white/40 text-center">
            Click outside to close
          </p>
        </div>
      </div>
    </motion.div>
  );
}
