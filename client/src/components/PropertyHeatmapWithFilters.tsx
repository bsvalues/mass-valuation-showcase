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
  // Fetch filter options
  const { data: filterOptions, isLoading: optionsLoading } = trpc.analytics.getPropertyFilterOptions.useQuery();
  
  // Filter state
  const [selectedPropertyTypes, setSelectedPropertyTypes] = useState<string[]>([]);
  const [valueRange, setValueRange] = useState<[number, number]>([0, 1000000]);
  const [yearRange, setYearRange] = useState<[number, number]>([1900, new Date().getFullYear()]);
  const [filtersActive, setFiltersActive] = useState(false);
  
  // Initialize ranges when options load
  useEffect(() => {
    if (filterOptions) {
      setValueRange([filterOptions.valueRange.min, filterOptions.valueRange.max]);
      setYearRange([filterOptions.yearRange.min, filterOptions.yearRange.max]);
    }
  }, [filterOptions]);
  
  // Fetch heatmap data with filters
  const { data: properties, isLoading: dataLoading } = trpc.analytics.getPropertyHeatmapData.useQuery(
    filtersActive ? {
      propertyTypes: selectedPropertyTypes.length > 0 ? selectedPropertyTypes : undefined,
      minValue: valueRange[0],
      maxValue: valueRange[1],
      minYear: yearRange[0],
      maxYear: yearRange[1],
    } : undefined,
    {
      enabled: !optionsLoading,
    }
  );
  
  const handleResetFilters = () => {
    setSelectedPropertyTypes([]);
    if (filterOptions) {
      setValueRange([filterOptions.valueRange.min, filterOptions.valueRange.max]);
      setYearRange([filterOptions.yearRange.min, filterOptions.yearRange.max]);
    }
    setFiltersActive(false);
  };
  
  const handleApplyFilters = () => {
    setFiltersActive(true);
  };
  
  const activeFilterCount = 
    selectedPropertyTypes.length + 
    (filtersActive && (valueRange[0] !== filterOptions?.valueRange.min || valueRange[1] !== filterOptions?.valueRange.max) ? 1 : 0) +
    (filtersActive && (yearRange[0] !== filterOptions?.yearRange.min || yearRange[1] !== filterOptions?.yearRange.max) ? 1 : 0);
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };
  
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
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Property Type Filter */}
            <div className="space-y-2">
              <Label htmlFor="property-type" className="text-sm text-slate-300">Property Type</Label>
              <Select
                value={selectedPropertyTypes[0] || "all"}
                onValueChange={(value) => {
                  if (value === "all") {
                    setSelectedPropertyTypes([]);
                  } else {
                    setSelectedPropertyTypes([value]);
                  }
                }}
              >
                <SelectTrigger id="property-type" className="bg-slate-800 border-slate-700">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {filterOptions?.propertyTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Value Range Filter */}
            <div className="space-y-2">
              <Label className="text-sm text-slate-300">
                Building Value Range
              </Label>
              <div className="text-xs text-cyan-400 mb-2">
                {formatCurrency(valueRange[0])} - {formatCurrency(valueRange[1])}
              </div>
              <Slider
                value={valueRange}
                onValueChange={(value) => setValueRange(value as [number, number])}
                min={filterOptions?.valueRange.min || 0}
                max={filterOptions?.valueRange.max || 1000000}
                step={10000}
                className="w-full"
              />
            </div>
            
            {/* Year Built Filter */}
            <div className="space-y-2">
              <Label className="text-sm text-slate-300">
                Year Built Range
              </Label>
              <div className="text-xs text-cyan-400 mb-2">
                {yearRange[0]} - {yearRange[1]}
              </div>
              <Slider
                value={yearRange}
                onValueChange={(value) => setYearRange(value as [number, number])}
                min={filterOptions?.yearRange.min || 1900}
                max={filterOptions?.yearRange.max || new Date().getFullYear()}
                step={1}
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
        properties={properties || []}
        isLoading={dataLoading || optionsLoading}
      />
    </div>
  );
}
