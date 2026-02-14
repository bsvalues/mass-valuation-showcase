import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { Plus, X, Download, Loader2 } from "lucide-react";
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

export default function PropertyComparison() {
  const [selectedProperties, setSelectedProperties] = useState<Property[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Search properties using tRPC
  const { data: searchResults, isLoading: isSearching } = trpc.propertyComparison.searchProperties.useQuery(
    { query: searchQuery, limit: 10 },
    { enabled: searchQuery.length > 2 }
  );

  // Use real search results or empty array
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
    pricePerSqft: r.sqft ? Math.round(r.salePrice / r.sqft) : 0,
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
      metric: "Assessed Value (K)",
      ...selectedProperties.reduce((acc, prop, idx) => ({
        ...acc,
        [`Property ${idx + 1}`]: Math.round(prop.assessedValue / 1000)
      }), {})
    }
  ];

  // Radar chart data
  const radarData = [
    { metric: "Size", ...selectedProperties.reduce((acc, prop, idx) => ({ ...acc, [`P${idx + 1}`]: (prop.sqft / 3000) * 100 }), {}) },
    { metric: "Age", ...selectedProperties.reduce((acc, prop, idx) => ({ ...acc, [`P${idx + 1}`]: ((2026 - prop.yearBuilt) / 50) * 100 }), {}) },
    { metric: "Value", ...selectedProperties.reduce((acc, prop, idx) => ({ ...acc, [`P${idx + 1}`]: (prop.assessedValue / 600000) * 100 }), {}) },
    { metric: "Price/Sqft", ...selectedProperties.reduce((acc, prop, idx) => ({ ...acc, [`P${idx + 1}`]: (prop.pricePerSqft / 300) * 100 }), {}) },
    { metric: "Bedrooms", ...selectedProperties.reduce((acc, prop, idx) => ({ ...acc, [`P${idx + 1}`]: (prop.bedrooms / 5) * 100 }), {}) }
  ];

  const colors = ["#00FFEE", "#0088FF", "#FF6B9D", "#FFB800"];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Property Comparison</h1>
          <p className="text-muted-foreground">Compare up to 4 properties side-by-side</p>
        </div>

        {/* Property Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Properties</CardTitle>
            <CardDescription>Search and add properties to compare (max 4)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search by parcel ID or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button>Search</Button>
            </div>

            {/* Quick add mock properties for demo */}
            <div className="flex gap-2">
              {availableProperties.map((prop: Property) => (
                <Button
                  key={prop.id}
                  variant="outline"
                  size="sm"
                  onClick={() => addProperty(prop)}
                  disabled={selectedProperties.length >= 4 || selectedProperties.some(p => p.id === prop.id)}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  {prop.address}
                </Button>
              ))}
            </div>

            {/* Selected Properties */}
            {selectedProperties.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {selectedProperties.map((prop, idx) => (
                  <Badge key={prop.id} variant="secondary" className="px-3 py-2">
                    <span className="mr-2">{prop.address}</span>
                    <button onClick={() => removeProperty(prop.id)} className="hover:text-destructive">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {selectedProperties.length >= 2 && (
          <>
            {/* Comparison Table */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Property Details</CardTitle>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export PDF
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Metric</TableHead>
                      {selectedProperties.map((prop, idx) => (
                        <TableHead key={prop.id}>Property {idx + 1}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Address</TableCell>
                      {selectedProperties.map(prop => (
                        <TableCell key={prop.id}>{prop.address}</TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Parcel ID</TableCell>
                      {selectedProperties.map(prop => (
                        <TableCell key={prop.id}>{prop.parcelId}</TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Square Feet</TableCell>
                      {selectedProperties.map(prop => (
                        <TableCell key={prop.id}>{prop.sqft.toLocaleString()}</TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Year Built</TableCell>
                      {selectedProperties.map(prop => (
                        <TableCell key={prop.id}>{prop.yearBuilt}</TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Bedrooms</TableCell>
                      {selectedProperties.map(prop => (
                        <TableCell key={prop.id}>{prop.bedrooms}</TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Bathrooms</TableCell>
                      {selectedProperties.map(prop => (
                        <TableCell key={prop.id}>{prop.bathrooms}</TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Assessed Value</TableCell>
                      {selectedProperties.map(prop => (
                        <TableCell key={prop.id}>${prop.assessedValue.toLocaleString()}</TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Price per Sqft</TableCell>
                      {selectedProperties.map(prop => (
                        <TableCell key={prop.id}>${prop.pricePerSqft}</TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Quality</TableCell>
                      {selectedProperties.map(prop => (
                        <TableCell key={prop.id}>{prop.quality}</TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Condition</TableCell>
                      {selectedProperties.map(prop => (
                        <TableCell key={prop.id}>{prop.condition}</TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Cluster ID</TableCell>
                      {selectedProperties.map(prop => (
                        <TableCell key={prop.id}>{prop.clusterId}</TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Metric Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={comparisonData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="metric" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      {selectedProperties.map((_, idx) => (
                        <Bar key={idx} dataKey={`Property ${idx + 1}`} fill={colors[idx]} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Property Profile Overlay</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="metric" />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} />
                      {selectedProperties.map((_, idx) => (
                        <Radar
                          key={idx}
                          name={`Property ${idx + 1}`}
                          dataKey={`P${idx + 1}`}
                          stroke={colors[idx]}
                          fill={colors[idx]}
                          fillOpacity={0.3}
                        />
                      ))}
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {selectedProperties.length < 2 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Select at least 2 properties to begin comparison
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
