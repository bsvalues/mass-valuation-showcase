import { useState } from "react";
import { BentoCard, BentoGrid } from "@/components/terra/BentoCard";
import { TactileButton } from "@/components/terra/TactileButton";
import { LiquidPanel } from "@/components/terra/LiquidPanel";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { Plus, X, Download, Loader2, GitCompare, Home, Ruler, Calendar, Bed, Bath, DollarSign } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface Property {
  id: string;
  parcelId: string;
  address: string;
  sqft: number;
  yearBuilt: number;
  bedrooms: number;
  bathrooms: number;
  assessedValue: number;
  salePrice?: number;
  pricePerSqft: number;
  quality: string;
  condition: string;
  clusterId: number;
}

/**
 * Property Comparison - TerraFusion Canonical Scene
 * 
 * Design Principles Applied:
 * - Bento Grid for property cards (side-by-side comparison)
 * - LiquidPanel for charts (synchronized visualizations)
 * - TactileButton for actions (add/remove properties)
 * - Glass materials for search and tables
 */
export default function PropertyComparison() {
  const [selectedProperties, setSelectedProperties] = useState<Property[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Search properties using tRPC
  const { data: searchResults, isLoading: isSearching } = trpc.propertyComparison.searchProperties.useQuery(
    { query: searchQuery, limit: 10 },
    { enabled: searchQuery.length > 2 }
  );

  const availableProperties: Property[] = (searchResults || []).map(r => ({
    id: r.id.toString(),
    parcelId: r.parcelId,
    address: r.address || "Unknown",
    sqft: r.sqft || 0,
    yearBuilt: r.yearBuilt || 0,
    bedrooms: r.bedrooms || 0,
    bathrooms: r.bathrooms || 0,
    assessedValue: r.assessedValue || 0,
    salePrice: r.salePrice || 0,
    pricePerSqft: r.sqft ? Math.round((r.salePrice || r.assessedValue) / r.sqft) : 0,
    quality: "Average",
    condition: "Good",
    clusterId: 1
  })) as Property[];

  const addProperty = (property: Property) => {
    if (selectedProperties.length < 4 && !selectedProperties.find(p => p.id === property.id)) {
      setSelectedProperties([...selectedProperties, property]);
    }
  };

  const removeProperty = (id: string) => {
    setSelectedProperties(selectedProperties.filter(p => p.id !== id));
  };

  // Prepare comparison data for charts
  const comparisonData = [
    {
      metric: "Sqft",
      ...selectedProperties.reduce((acc, prop, idx) => ({
        ...acc,
        [`Property ${idx + 1}`]: prop.sqft
      }), {})
    },
    {
      metric: "Price/Sqft",
      ...selectedProperties.reduce((acc, prop, idx) => ({
        ...acc,
        [`Property ${idx + 1}`]: prop.pricePerSqft
      }), {})
    },
    {
      metric: "Year Built",
      ...selectedProperties.reduce((acc, prop, idx) => ({
        ...acc,
        [`Property ${idx + 1}`]: prop.yearBuilt
      }), {})
    },
    {
      metric: "Bedrooms",
      ...selectedProperties.reduce((acc, prop, idx) => ({
        ...acc,
        [`Property ${idx + 1}`]: prop.bedrooms
      }), {})
    },
    {
      metric: "Bathrooms",
      ...selectedProperties.reduce((acc, prop, idx) => ({
        ...acc,
        [`Property ${idx + 1}`]: prop.bathrooms
      }), {})
    },
  ];

  const radarData = [
    {
      attribute: "Size",
      ...selectedProperties.reduce((acc, prop, idx) => ({
        ...acc,
        [`P${idx + 1}`]: (prop.sqft / 3000) * 100
      }), {})
    },
    {
      attribute: "Value",
      ...selectedProperties.reduce((acc, prop, idx) => ({
        ...acc,
        [`P${idx + 1}`]: (prop.pricePerSqft / 500) * 100
      }), {})
    },
    {
      attribute: "Age",
      ...selectedProperties.reduce((acc, prop, idx) => ({
        ...acc,
        [`P${idx + 1}`]: ((2026 - prop.yearBuilt) / 100) * 100
      }), {})
    },
    {
      attribute: "Beds",
      ...selectedProperties.reduce((acc, prop, idx) => ({
        ...acc,
        [`P${idx + 1}`]: (prop.bedrooms / 5) * 100
      }), {})
    },
    {
      attribute: "Baths",
      ...selectedProperties.reduce((acc, prop, idx) => ({
        ...acc,
        [`P${idx + 1}`]: (prop.bathrooms / 4) * 100
      }), {})
    },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div>
        <h1 className="text-4xl font-bold text-text-primary mb-2">
          Property Comparison
        </h1>
        <p className="text-lg text-text-secondary">
          Side-by-side analysis of up to 4 properties. {selectedProperties.length} of 4 selected.
        </p>
      </div>

      {/* Property Search */}
      <LiquidPanel intensity={1} className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Input
              placeholder="Search by parcel ID or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-glass-2 border-glass-border"
            />
            {isSearching && <Loader2 className="w-5 h-5 animate-spin text-signal-primary" />}
          </div>

          {searchQuery.length > 2 && availableProperties.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-text-secondary">{availableProperties.length} properties found</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {availableProperties.map((property) => (
                  <div
                    key={property.id}
                    className="flex items-center justify-between p-3 bg-glass-2 border border-glass-border rounded-lg hover:bg-glass-3 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-text-primary">{property.address}</p>
                      <p className="text-xs text-text-secondary">Parcel: {property.parcelId}</p>
                    </div>
                    <TactileButton
                      variant="glass"
                      size="sm"
                      onClick={() => addProperty(property)}
                      disabled={selectedProperties.length >= 4 || selectedProperties.some(p => p.id === property.id)}
                    >
                      <Plus className="w-4 h-4" />
                    </TactileButton>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </LiquidPanel>

      {/* Empty State */}
      {selectedProperties.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <GitCompare className="w-16 h-16 text-text-secondary mb-4" />
          <h3 className="text-xl font-semibold text-text-primary mb-2">No Properties Selected</h3>
          <p className="text-text-secondary text-center max-w-md">
            Search for properties above and add them to compare side-by-side. You can select up to 4 properties at once.
          </p>
        </div>
      )}

      {selectedProperties.length === 1 && (
        <div className="flex flex-col items-center justify-center py-12">
          <GitCompare className="w-12 h-12 text-chart-3 mb-3" />
          <h3 className="text-lg font-semibold text-text-primary mb-2">Add More Properties</h3>
          <p className="text-text-secondary text-center max-w-md">
            You need at least 2 properties to see comparison charts. Add 1-3 more properties to begin analysis.
          </p>
        </div>
      )}

      {/* Property Cards Bento Grid */}
      {selectedProperties.length > 0 && (
        <BentoGrid>
          {selectedProperties.map((property, idx) => (
            <BentoCard
              key={property.id}
              title={`Property ${idx + 1}`}
              icon={<Home className="w-5 h-5" />}
              span="1"
            >
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-text-primary">{property.address}</p>
                  <p className="text-xs text-text-secondary font-mono">Parcel: {property.parcelId}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-text-secondary" />
                    <span className="text-text-primary">{property.sqft.toLocaleString()} sqft</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-text-secondary" />
                    <span className="text-text-primary">{property.yearBuilt}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bed className="w-4 h-4 text-text-secondary" />
                    <span className="text-text-primary">{property.bedrooms} beds</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bath className="w-4 h-4 text-text-secondary" />
                    <span className="text-text-primary">{property.bathrooms} baths</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-glass-border">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-text-secondary">Assessed Value</span>
                    <span className="text-sm font-semibold text-text-primary">
                      ${property.assessedValue.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-secondary">Price/Sqft</span>
                    <span className="text-sm font-semibold text-signal-primary">
                      ${property.pricePerSqft}/sqft
                    </span>
                  </div>
                </div>

                <TactileButton
                  variant="glass"
                  size="sm"
                  onClick={() => removeProperty(property.id)}
                  className="w-full"
                >
                  <X className="w-4 h-4 mr-2" />
                  Remove
                </TactileButton>
              </div>
            </BentoCard>
          ))}
        </BentoGrid>
      )}

      {/* Comparison Charts */}
      {selectedProperties.length >= 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart */}
          <LiquidPanel intensity={2} className="p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Property Metrics</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="metric" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(10, 14, 26, 0.9)",
                    border: "1px solid rgba(0, 255, 238, 0.3)",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                {selectedProperties.map((_, idx) => (
                  <Bar
                    key={idx}
                    dataKey={`Property ${idx + 1}`}
                    fill={`hsl(${180 + idx * 60}, 70%, 50%)`}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </LiquidPanel>

          {/* Radar Chart */}
          <LiquidPanel intensity={2} className="p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Attribute Comparison</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.2)" />
                <PolarAngleAxis dataKey="attribute" stroke="rgba(255,255,255,0.5)" />
                <PolarRadiusAxis stroke="rgba(255,255,255,0.3)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(10, 14, 26, 0.9)",
                    border: "1px solid rgba(0, 255, 238, 0.3)",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                {selectedProperties.map((_, idx) => (
                  <Radar
                    key={idx}
                    name={`Property ${idx + 1}`}
                    dataKey={`P${idx + 1}`}
                    stroke={`hsl(${180 + idx * 60}, 70%, 50%)`}
                    fill={`hsl(${180 + idx * 60}, 70%, 50%)`}
                    fillOpacity={0.3}
                  />
                ))}
              </RadarChart>
            </ResponsiveContainer>
          </LiquidPanel>
        </div>
      )}

      {/* Detailed Comparison Table */}
      {selectedProperties.length >= 2 && (
        <LiquidPanel intensity={1} className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-glass-border">
                  <TableHead className="text-text-secondary">Attribute</TableHead>
                  {selectedProperties.map((_, idx) => (
                    <TableHead key={idx} className="text-text-secondary">Property {idx + 1}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="border-glass-border">
                  <TableCell className="font-medium text-text-primary">Address</TableCell>
                  {selectedProperties.map((prop) => (
                    <TableCell key={prop.id} className="text-text-primary">{prop.address}</TableCell>
                  ))}
                </TableRow>
                <TableRow className="border-glass-border">
                  <TableCell className="font-medium text-text-primary">Parcel ID</TableCell>
                  {selectedProperties.map((prop) => (
                    <TableCell key={prop.id} className="font-mono text-sm text-text-primary">{prop.parcelId}</TableCell>
                  ))}
                </TableRow>
                <TableRow className="border-glass-border">
                  <TableCell className="font-medium text-text-primary">Square Feet</TableCell>
                  {selectedProperties.map((prop) => (
                    <TableCell key={prop.id} className="text-text-primary">{prop.sqft.toLocaleString()}</TableCell>
                  ))}
                </TableRow>
                <TableRow className="border-glass-border">
                  <TableCell className="font-medium text-text-primary">Year Built</TableCell>
                  {selectedProperties.map((prop) => (
                    <TableCell key={prop.id} className="text-text-primary">{prop.yearBuilt}</TableCell>
                  ))}
                </TableRow>
                <TableRow className="border-glass-border">
                  <TableCell className="font-medium text-text-primary">Bedrooms</TableCell>
                  {selectedProperties.map((prop) => (
                    <TableCell key={prop.id} className="text-text-primary">{prop.bedrooms}</TableCell>
                  ))}
                </TableRow>
                <TableRow className="border-glass-border">
                  <TableCell className="font-medium text-text-primary">Bathrooms</TableCell>
                  {selectedProperties.map((prop) => (
                    <TableCell key={prop.id} className="text-text-primary">{prop.bathrooms}</TableCell>
                  ))}
                </TableRow>
                <TableRow className="border-glass-border">
                  <TableCell className="font-medium text-text-primary">Assessed Value</TableCell>
                  {selectedProperties.map((prop) => (
                    <TableCell key={prop.id} className="text-text-primary">${prop.assessedValue.toLocaleString()}</TableCell>
                  ))}
                </TableRow>
                <TableRow className="border-glass-border">
                  <TableCell className="font-medium text-text-primary">Price/Sqft</TableCell>
                  {selectedProperties.map((prop) => (
                    <TableCell key={prop.id} className="font-semibold text-signal-primary">${prop.pricePerSqft}/sqft</TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </LiquidPanel>
      )}
    </div>
  );
}
