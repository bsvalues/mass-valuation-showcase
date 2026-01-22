/**
 * CSV Export Utility
 * Generates CSV files from spatial query results and property data
 */

export interface PropertyData {
  id: number;
  address: string;
  parcelNumber: string;
  assessedValue: number;
  squareFootage: number;
  yearBuilt: number;
  propertyType: string;
  latitude: string;
  longitude: string;
}

export interface NeighborhoodStats {
  medianValue: number;
  medianSquareFootage: number;
  medianPricePerSqFt: number;
  propertyTypes: Record<string, number>;
  averageAge: number;
  propertyCount: number;
}

export interface SpatialQueryResult {
  layerId: string;
  layerName: string;
  features: any[];
}

/**
 * Convert spatial query results to CSV format
 */
export function exportSpatialQueryToCSV(
  property: PropertyData,
  neighborhoodStats: NeighborhoodStats,
  queryResults: SpatialQueryResult[]
): void {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const filename = `spatial-query-${property.parcelNumber || property.id}-${timestamp}.csv`;

  // Build CSV content
  const rows: string[] = [];

  // Header
  rows.push("Spatial Query Export");
  rows.push(`Generated: ${new Date().toLocaleString()}`);
  rows.push("");

  // Property Information
  rows.push("PROPERTY INFORMATION");
  rows.push("Field,Value");
  rows.push(`Address,"${escapeCSV(property.address)}"`);
  rows.push(`Parcel Number,"${escapeCSV(property.parcelNumber)}"`);
  rows.push(`Assessed Value,"$${property.assessedValue.toLocaleString()}"`);
  rows.push(`Square Footage,"${property.squareFootage.toLocaleString()} sq ft"`);
  rows.push(`Year Built,${property.yearBuilt}`);
  rows.push(`Property Type,"${escapeCSV(property.propertyType)}"`);
  rows.push(`Coordinates,"${property.latitude}, ${property.longitude}"`);
  rows.push("");

  // Neighborhood Statistics
  rows.push("NEIGHBORHOOD STATISTICS (1-MILE RADIUS)");
  rows.push("Metric,Value");
  rows.push(`Median Property Value,"$${neighborhoodStats.medianValue.toLocaleString()}"`);
  rows.push(`Median Square Footage,"${neighborhoodStats.medianSquareFootage.toLocaleString()} sq ft"`);
  rows.push(`Median Price per Sq Ft,"$${neighborhoodStats.medianPricePerSqFt.toFixed(2)}/sq ft"`);
  rows.push(`Average Property Age,"${neighborhoodStats.averageAge.toFixed(1)} years"`);
  rows.push(`Total Properties in Area,${neighborhoodStats.propertyCount}`);
  rows.push("");

  // Property Type Distribution
  rows.push("PROPERTY TYPE DISTRIBUTION");
  rows.push("Type,Count,Percentage");
  const totalTypes = Object.values(neighborhoodStats.propertyTypes).reduce((sum, count) => sum + count, 0);
  Object.entries(neighborhoodStats.propertyTypes).forEach(([type, count]) => {
    const percentage = ((count / totalTypes) * 100).toFixed(1);
    rows.push(`"${escapeCSV(type)}",${count},${percentage}%`);
  });
  rows.push("");

  // Intersecting Layers
  rows.push("INTERSECTING LAYERS");
  rows.push("Layer,Feature Count,Details");
  
  if (queryResults.length === 0) {
    rows.push("No intersecting layers found");
  } else {
    queryResults.forEach(result => {
      rows.push(`"${escapeCSV(result.layerName)}",${result.features.length},"${escapeCSV(formatLayerDetails(result))}"`);
    });
  }
  rows.push("");

  // Detailed Layer Features
  if (queryResults.length > 0) {
    rows.push("DETAILED LAYER FEATURES");
    queryResults.forEach(result => {
      rows.push("");
      rows.push(`Layer: ${result.layerName}`);
      rows.push("Feature,Attributes");
      
      result.features.forEach((feature, index) => {
        const attrs = formatFeatureAttributes(result.layerId, feature.properties);
        rows.push(`Feature ${index + 1},"${escapeCSV(attrs)}"`);
      });
    });
  }

  // Create CSV content
  const csvContent = rows.join("\n");

  // Trigger download
  downloadCSV(csvContent, filename);
}

/**
 * Export property list to CSV
 */
export function exportPropertiesToCSV(properties: PropertyData[]): void {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const filename = `properties-export-${timestamp}.csv`;

  const rows: string[] = [];

  // Header
  rows.push("Address,Parcel Number,Assessed Value,Square Footage,Year Built,Property Type,Latitude,Longitude");

  // Data rows
  properties.forEach(prop => {
    rows.push([
      `"${escapeCSV(prop.address)}"`,
      `"${escapeCSV(prop.parcelNumber)}"`,
      prop.assessedValue,
      prop.squareFootage,
      prop.yearBuilt,
      `"${escapeCSV(prop.propertyType)}"`,
      prop.latitude,
      prop.longitude
    ].join(","));
  });

  const csvContent = rows.join("\n");
  downloadCSV(csvContent, filename);
}

/**
 * Export neighborhood comparison to CSV
 */
export function exportNeighborhoodComparisonToCSV(
  properties: Array<PropertyData & { neighborhoodStats: NeighborhoodStats }>
): void {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const filename = `neighborhood-comparison-${timestamp}.csv`;

  const rows: string[] = [];

  // Header
  rows.push("Address,Parcel Number,Assessed Value,Neighborhood Median Value,Value vs Median,Neighborhood Avg Age,Property Age");

  // Data rows
  properties.forEach(prop => {
    const currentYear = new Date().getFullYear();
    const propertyAge = currentYear - prop.yearBuilt;
    const valueVsMedian = ((prop.assessedValue / prop.neighborhoodStats.medianValue - 1) * 100).toFixed(1);
    
    rows.push([
      `"${escapeCSV(prop.address)}"`,
      `"${escapeCSV(prop.parcelNumber)}"`,
      `$${prop.assessedValue.toLocaleString()}`,
      `$${prop.neighborhoodStats.medianValue.toLocaleString()}`,
      `${valueVsMedian}%`,
      `${prop.neighborhoodStats.averageAge.toFixed(1)} years`,
      `${propertyAge} years`
    ].join(","));
  });

  const csvContent = rows.join("\n");
  downloadCSV(csvContent, filename);
}

/**
 * Helper: Escape CSV special characters
 */
function escapeCSV(value: string): string {
  if (!value) return "";
  return value.replace(/"/g, '""');
}

/**
 * Helper: Format layer details summary
 */
function formatLayerDetails(result: SpatialQueryResult): string {
  if (result.features.length === 0) return "No features";
  
  const firstFeature = result.features[0];
  const props = firstFeature.properties;
  
  // Extract key information based on layer type
  switch (result.layerId) {
    case "zoning-districts":
      return props.zone_type || "Unknown zone";
    case "school-districts":
      return props.district_name || "Unknown district";
    case "flood-zones":
      return `${props.zone_type} (${props.risk_level} risk)`;
    case "transit-routes":
      return `Route ${props.route_number}: ${props.route_name}`;
    case "parks-recreation":
      return `${props.park_name} (${props.park_type})`;
    case "utility-lines":
      return `${props.utility_type} - ${props.operator}`;
    default:
      return `${result.features.length} feature(s)`;
  }
}

/**
 * Helper: Format feature attributes for display
 */
function formatFeatureAttributes(layerId: string, properties: any): string {
  const attrs: string[] = [];
  
  switch (layerId) {
    case "zoning-districts":
      attrs.push(`Zone: ${properties.zone_type}`);
      attrs.push(`Description: ${properties.description}`);
      break;
    case "school-districts":
      attrs.push(`District: ${properties.district_name}`);
      attrs.push(`Type: ${properties.district_type}`);
      attrs.push(`Grades: ${properties.grades_served}`);
      break;
    case "flood-zones":
      attrs.push(`Zone: ${properties.zone_type}`);
      attrs.push(`Risk: ${properties.risk_level}`);
      break;
    case "transit-routes":
      attrs.push(`Route: ${properties.route_number}`);
      attrs.push(`Name: ${properties.route_name}`);
      attrs.push(`Type: ${properties.route_type}`);
      break;
    case "parks-recreation":
      attrs.push(`Park: ${properties.park_name}`);
      attrs.push(`Type: ${properties.park_type}`);
      attrs.push(`Size: ${properties.acres} acres`);
      break;
    case "utility-lines":
      attrs.push(`Type: ${properties.utility_type}`);
      attrs.push(`Operator: ${properties.operator}`);
      attrs.push(`Status: ${properties.status}`);
      break;
    default:
      Object.entries(properties).forEach(([key, value]) => {
        attrs.push(`${key}: ${value}`);
      });
  }
  
  return attrs.join("; ");
}

/**
 * Helper: Trigger CSV download in browser
 */
function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
