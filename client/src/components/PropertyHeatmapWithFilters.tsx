import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { PropertyHeatmap } from "./PropertyHeatmap";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Filter } from "lucide-react";

export function PropertyHeatmapWithFilters() {
  // Fetch filter options from real database
  const { data: filterOptions, isLoading: optionsLoading } = trpc.analytics.getPropertyFilterOptions.useQuery();

  // Filter state
  const [selectedPropertyType, setSelectedPropertyType] = useState<string>("all");
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>("all");
  const [valueRange, setValueRange] = useState<[number, number]>([0, 2000000]);
  const [filtersActive, setFiltersActive] = useState(false);

  // Fetch heatmap data with applied filters
  const { data: rawProperties, isLoading: dataLoading } = trpc.analytics.getPropertyHeatmapData.useQuery(
    {
      propertyType: filtersActive && selectedPropertyType !== "all" ? selectedPropertyType : undefined,
      neighborhood: filtersActive && selectedNeighborhood !== "all" ? selectedNeighborhood : undefined,
      minValue: filtersActive ? valueRange[0] : undefined,
      maxValue: filtersActive ? valueRange[1] : undefined,
      limit: 500,
    },
    { enabled: !optionsLoading }
  );

  // Map raw data to PropertyHeatmap's expected format
  const properties = (rawProperties ?? []).map(p => ({
    id: p.id,
    parcelNumber: p.parcelId,
    latitude: p.lat,
    longitude: p.lng,
    value: p.totalValue ?? 0,
  }));

  const handleResetFilters = () => {
    setSelectedPropertyType("all");
    setSelectedNeighborhood("all");
    setValueRange([0, 2000000]);
    setFiltersActive(false);
  };

  const handleApplyFilters = () => {
    setFiltersActive(true);
  };

  const activeFilterCount =
    (filtersActive && selectedPropertyType !== "all" ? 1 : 0) +
    (filtersActive && selectedNeighborhood !== "all" ? 1 : 0) +
    (filtersActive && (valueRange[0] > 0 || valueRange[1] < 2000000) ? 1 : 0);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

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
            </div>
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-8 text-xs text-cyan-400 hover:text-cyan-300"
              >
                <X className="w-3 h-3 mr-1" />
                Reset All
              </Button>
            )}
          </div>
          <CardDescription className="text-slate-400">
            Filter {properties.length.toLocaleString()} properties displayed on the heatmap
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Property Type Filter */}
            <div className="space-y-2">
              <Label htmlFor="property-type" className="text-sm text-slate-300">
                Property Type
              </Label>
              <Select
                value={selectedPropertyType}
                onValueChange={setSelectedPropertyType}
                disabled={optionsLoading}
              >
                <SelectTrigger id="property-type" className="bg-slate-800 border-slate-700">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {(filterOptions?.propertyTypes ?? []).map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Neighborhood Filter */}
            <div className="space-y-2">
              <Label htmlFor="neighborhood" className="text-sm text-slate-300">
                Neighborhood
              </Label>
              <Select
                value={selectedNeighborhood}
                onValueChange={setSelectedNeighborhood}
                disabled={optionsLoading}
              >
                <SelectTrigger id="neighborhood" className="bg-slate-800 border-slate-700">
                  <SelectValue placeholder="All Neighborhoods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Neighborhoods</SelectItem>
                  {(filterOptions?.neighborhoods ?? []).map((n) => (
                    <SelectItem key={n} value={n}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Value Range Filter */}
            <div className="space-y-2">
              <Label className="text-sm text-slate-300">Total Value Range</Label>
              <div className="text-xs text-cyan-400 mb-2">
                {formatCurrency(valueRange[0])} – {formatCurrency(valueRange[1])}
              </div>
              <Slider
                value={valueRange}
                onValueChange={(value) => setValueRange(value as [number, number])}
                min={0}
                max={2000000}
                step={10000}
                className="w-full"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleApplyFilters}
              className="bg-cyan-500 hover:bg-cyan-600 text-slate-900"
            >
              <Filter className="w-4 h-4 mr-2" />
              Apply Filters
            </Button>
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
