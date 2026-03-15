import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { PropertyHeatmap } from "./PropertyHeatmap";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Filter, Loader2, RotateCcw } from "lucide-react";

const VALUE_PRESETS = [
  { label: "< $200K", min: 0, max: 200_000 },
  { label: "$200K–$500K", min: 200_000, max: 500_000 },
  { label: "$500K–$1M", min: 500_000, max: 1_000_000 },
  { label: "> $1M", min: 1_000_000, max: 5_000_000 },
];

const YEAR_PRESETS = [
  { label: "Pre-1950", min: 1800, max: 1950 },
  { label: "1950–1980", min: 1950, max: 1980 },
  { label: "1980–2000", min: 1980, max: 2000 },
  { label: "2000+", min: 2000, max: 2026 },
];

const DEFAULT_VALUE_RANGE: [number, number] = [0, 2_000_000];
const DEFAULT_YEAR_RANGE: [number, number] = [1900, 2026];

export function PropertyHeatmapWithFilters() {
  // Fetch filter options from real database
  const { data: filterOptions, isLoading: optionsLoading } = trpc.analytics.getPropertyFilterOptions.useQuery();

  // Filter state — live-apply (no separate Apply button needed)
  const [selectedPropertyType, setSelectedPropertyType] = useState<string>("all");
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>("all");
  const [valueRange, setValueRange] = useState<[number, number]>(DEFAULT_VALUE_RANGE);
  const [yearRange, setYearRange] = useState<[number, number]>(DEFAULT_YEAR_RANGE);

  // Build query input reactively
  const queryInput = useMemo(() => ({
    propertyType: selectedPropertyType !== "all" ? selectedPropertyType : undefined,
    neighborhood: selectedNeighborhood !== "all" ? selectedNeighborhood : undefined,
    minValue: valueRange[0] > 0 ? valueRange[0] : undefined,
    maxValue: valueRange[1] < DEFAULT_VALUE_RANGE[1] ? valueRange[1] : undefined,
    minYearBuilt: yearRange[0] > DEFAULT_YEAR_RANGE[0] ? yearRange[0] : undefined,
    maxYearBuilt: yearRange[1] < DEFAULT_YEAR_RANGE[1] ? yearRange[1] : undefined,
    limit: 500,
  }), [selectedPropertyType, selectedNeighborhood, valueRange, yearRange]);

  const { data: rawProperties, isLoading: dataLoading } = trpc.analytics.getPropertyHeatmapData.useQuery(
    queryInput,
    { enabled: !optionsLoading }
  );

  const properties = (rawProperties ?? []).map(p => ({
    id: p.id,
    parcelNumber: p.parcelId,
    latitude: p.lat,
    longitude: p.lng,
    value: p.totalValue ?? 0,
  }));

  const activeFilterCount =
    (selectedPropertyType !== "all" ? 1 : 0) +
    (selectedNeighborhood !== "all" ? 1 : 0) +
    (valueRange[0] > 0 || valueRange[1] < DEFAULT_VALUE_RANGE[1] ? 1 : 0) +
    (yearRange[0] > DEFAULT_YEAR_RANGE[0] || yearRange[1] < DEFAULT_YEAR_RANGE[1] ? 1 : 0);

  const handleReset = () => {
    setSelectedPropertyType("all");
    setSelectedNeighborhood("all");
    setValueRange(DEFAULT_VALUE_RANGE);
    setYearRange(DEFAULT_YEAR_RANGE);
  };

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);

  return (
    <div className="space-y-4">
      {/* Filters Card */}
      <Card className="border-cyan-500/20 bg-slate-900/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-cyan-400" />
              <CardTitle className="text-base">Heatmap Filters</CardTitle>
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="bg-cyan-500/20 text-cyan-400">
                  {activeFilterCount} active
                </Badge>
              )}
              {dataLoading && (
                <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">
                {dataLoading ? "Loading…" : `${properties.length.toLocaleString()} properties`}
              </span>
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="h-8 text-xs text-cyan-400 hover:text-cyan-300"
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Reset All
                </Button>
              )}
            </div>
          </div>
          <CardDescription className="text-slate-400">
            Filters apply live — no button required
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Row 1: Dropdowns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Property Type */}
            <div className="space-y-2">
              <Label className="text-sm text-slate-300">Property Type</Label>
              <Select value={selectedPropertyType} onValueChange={setSelectedPropertyType} disabled={optionsLoading}>
                <SelectTrigger className="bg-slate-800 border-slate-700">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {(filterOptions?.propertyTypes ?? []).map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Neighborhood */}
            <div className="space-y-2">
              <Label className="text-sm text-slate-300">Neighborhood</Label>
              <Select value={selectedNeighborhood} onValueChange={setSelectedNeighborhood} disabled={optionsLoading}>
                <SelectTrigger className="bg-slate-800 border-slate-700">
                  <SelectValue placeholder="All Neighborhoods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Neighborhoods</SelectItem>
                  {(filterOptions?.neighborhoods ?? []).map((n) => (
                    <SelectItem key={n} value={n}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 2: Value Range */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-slate-300">Total Value Range</Label>
              <span className="text-xs text-cyan-400 font-mono">
                {formatCurrency(valueRange[0])} – {formatCurrency(valueRange[1])}
              </span>
            </div>
            <Slider
              value={valueRange}
              onValueChange={(v) => setValueRange(v as [number, number])}
              min={0}
              max={DEFAULT_VALUE_RANGE[1]}
              step={10_000}
              className="w-full"
            />
            {/* Value presets */}
            <div className="flex flex-wrap gap-2 pt-1">
              {VALUE_PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => setValueRange([p.min, p.max])}
                  className={`text-xs px-2 py-1 rounded border transition-colors ${
                    valueRange[0] === p.min && valueRange[1] === p.max
                      ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300"
                      : "border-slate-700 text-slate-400 hover:border-cyan-500/30 hover:text-slate-300"
                  }`}
                >
                  {p.label}
                </button>
              ))}
              {(valueRange[0] !== DEFAULT_VALUE_RANGE[0] || valueRange[1] !== DEFAULT_VALUE_RANGE[1]) && (
                <button
                  onClick={() => setValueRange(DEFAULT_VALUE_RANGE)}
                  className="text-xs px-2 py-1 rounded border border-slate-700 text-slate-500 hover:text-slate-300"
                >
                  <X className="w-3 h-3 inline mr-0.5" />Clear
                </button>
              )}
            </div>
          </div>

          {/* Row 3: Year Built Range */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-slate-300">Year Built Range</Label>
              <span className="text-xs text-cyan-400 font-mono">
                {yearRange[0]} – {yearRange[1]}
              </span>
            </div>
            <Slider
              value={yearRange}
              onValueChange={(v) => setYearRange(v as [number, number])}
              min={DEFAULT_YEAR_RANGE[0]}
              max={DEFAULT_YEAR_RANGE[1]}
              step={1}
              className="w-full"
            />
            {/* Year presets */}
            <div className="flex flex-wrap gap-2 pt-1">
              {YEAR_PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => setYearRange([p.min, p.max])}
                  className={`text-xs px-2 py-1 rounded border transition-colors ${
                    yearRange[0] === p.min && yearRange[1] === p.max
                      ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300"
                      : "border-slate-700 text-slate-400 hover:border-cyan-500/30 hover:text-slate-300"
                  }`}
                >
                  {p.label}
                </button>
              ))}
              {(yearRange[0] !== DEFAULT_YEAR_RANGE[0] || yearRange[1] !== DEFAULT_YEAR_RANGE[1]) && (
                <button
                  onClick={() => setYearRange(DEFAULT_YEAR_RANGE)}
                  className="text-xs px-2 py-1 rounded border border-slate-700 text-slate-500 hover:text-slate-300"
                >
                  <X className="w-3 h-3 inline mr-0.5" />Clear
                </button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Heatmap */}
      <PropertyHeatmap
        properties={properties}
        isLoading={dataLoading || optionsLoading}
      />
    </div>
  );
}
