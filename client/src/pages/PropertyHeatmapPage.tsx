import { DashboardLayout } from "@/components/DashboardLayout";
import { PropertyHeatmapWithFilters } from "@/components/PropertyHeatmapWithFilters";

export default function PropertyHeatmapPage() {
  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Property Value Heatmap</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Visualize assessed property values across the county. Use filters to isolate specific
            property types, neighborhoods, or value ranges.
          </p>
        </div>
        <PropertyHeatmapWithFilters />
      </div>
    </DashboardLayout>
  );
}
